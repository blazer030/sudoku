import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useStatisticsStore } from "@/stores/statisticsStore";
import type { GameResult, StatisticsRepository } from "@/application/statistics/StatisticsRepository";

const sampleGame: GameResult = {
    difficulty: "easy",
    elapsedSeconds: 60,
    completed: true,
    date: "2026-05-26T00:00:00.000Z",
    hintsUsed: 0,
};

const buildRepo = (overrides: Partial<StatisticsRepository> = {}): StatisticsRepository => ({
    load: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    ...overrides,
});

describe("useStatisticsStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("starts with an empty history", () => {
        const store = useStatisticsStore();
        expect(store.history).toEqual([]);
    });

    it("loadFromRepository hydrates history from the repository", async () => {
        const repo = buildRepo({ load: vi.fn().mockResolvedValue([sampleGame]) });
        const store = useStatisticsStore();
        store.setRepository(repo);

        await store.loadFromRepository();

        expect(store.history).toEqual([sampleGame]);
    });

    it("recordGame appends a stamped entry to history synchronously", () => {
        const store = useStatisticsStore();
        store.setRepository(buildRepo());

        store.recordGame({ difficulty: "easy", elapsedSeconds: 90, completed: true });

        expect(store.history).toHaveLength(1);
        expect(store.history[0]).toMatchObject({
            difficulty: "easy",
            elapsedSeconds: 90,
            completed: true,
            hintsUsed: 0,
        });
        expect(store.history[0].date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("recordGame defaults hintsUsed to 0 when omitted", () => {
        const store = useStatisticsStore();
        store.setRepository(buildRepo());

        store.recordGame({ difficulty: "medium", elapsedSeconds: 30, completed: false });

        expect(store.history[0].hintsUsed).toBe(0);
    });

    it("recordGame schedules a save to the repository with the new history", async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const repo = buildRepo({ save });
        const store = useStatisticsStore();
        store.setRepository(repo);

        store.recordGame({ difficulty: "hard", elapsedSeconds: 200, completed: true, hintsUsed: 2 });
        await Promise.resolve();

        expect(save).toHaveBeenCalledTimes(1);
        expect(save).toHaveBeenCalledWith(store.history);
    });
});
