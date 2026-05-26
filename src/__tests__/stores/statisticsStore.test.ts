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
});
