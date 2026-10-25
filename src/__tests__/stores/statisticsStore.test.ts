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
    append: vi.fn().mockResolvedValue(undefined),
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

    it("recordGame hands the repository only the new game, never the whole history", async () => {
        const append = vi.fn().mockResolvedValue(undefined);
        const repo = buildRepo({ append });
        const store = useStatisticsStore();
        store.setRepository(repo);

        store.recordGame({ difficulty: "hard", elapsedSeconds: 200, completed: true, hintsUsed: 2 });
        await Promise.resolve();

        expect(append).toHaveBeenCalledTimes(1);
        expect(append).toHaveBeenCalledWith(expect.objectContaining({ difficulty: "hard", elapsedSeconds: 200 }));
    });

    it("recordGame appends exactly the new game, whatever the history holds", () => {
        const store = useStatisticsStore();
        for (let index = 0; index < 5; index++) store.history.push({ ...sampleGame });
        const append = vi.fn().mockResolvedValue(undefined);
        store.setRepository(buildRepo({ append }));

        store.recordGame({ difficulty: "easy", elapsedSeconds: 10, completed: true });

        expect(append).toHaveBeenCalledTimes(1);
        expect(append).toHaveBeenCalledWith({
            difficulty: "easy",
            elapsedSeconds: 10,
            completed: true,
            hintsUsed: 0,
            date: expect.any(String) as string,
        });
    });

    it("recordGame stays resilient when the repository rejects (the bug that motivated this refactor)", async () => {
        const append = vi.fn().mockRejectedValue(new DOMException("QuotaExceededError", "QuotaExceededError"));
        const repo = buildRepo({ append });
        const store = useStatisticsStore();
        store.setRepository(repo);

        expect(() => {
            store.recordGame({ difficulty: "easy", elapsedSeconds: 30, completed: true });
        }).not.toThrow();
        // Allow the rejected promise to settle; the store's persist must swallow it
        // so it does not surface as an unhandled rejection.
        await Promise.resolve();
        await Promise.resolve();
        expect(store.history).toHaveLength(1);
    });

    it("clearAll empties history and clears the repository", async () => {
        const clear = vi.fn().mockResolvedValue(undefined);
        const repo = buildRepo({ load: vi.fn().mockResolvedValue([sampleGame]), clear });
        const store = useStatisticsStore();
        store.setRepository(repo);
        await store.loadFromRepository();

        await store.clearAll();

        expect(store.history).toEqual([]);
        expect(clear).toHaveBeenCalledTimes(1);
    });

    describe("statistics getter", () => {
        const game = (overrides: Partial<GameResult>): GameResult => ({
            difficulty: "easy",
            elapsedSeconds: 60,
            completed: true,
            date: "2026-05-26T00:00:00.000Z",
            hintsUsed: 0,
            ...overrides,
        });

        it("returns zeroed difficulty stats when history is empty", () => {
            const store = useStatisticsStore();
            expect(store.statistics).toEqual({
                easy: { gamesWon: 0, gamesPlayed: 0, bestTime: null, averageTime: null },
                medium: { gamesWon: 0, gamesPlayed: 0, bestTime: null, averageTime: null },
                hard: { gamesWon: 0, gamesPlayed: 0, bestTime: null, averageTime: null },
                overall: { gamesWon: 0, gamesPlayed: 0, winRate: 0 },
            });
        });

        it("computes best, average and win rate", async () => {
            const repo = buildRepo({
                load: vi.fn().mockResolvedValue([
                    game({ difficulty: "easy", elapsedSeconds: 100, completed: true }),
                    game({ difficulty: "easy", elapsedSeconds: 50, completed: true }),
                    game({ difficulty: "easy", elapsedSeconds: 999, completed: false }),
                    game({ difficulty: "hard", elapsedSeconds: 600, completed: true }),
                ]),
            });
            const store = useStatisticsStore();
            store.setRepository(repo);
            await store.loadFromRepository();

            const stats = store.statistics;
            expect(stats.easy).toEqual({
                gamesWon: 2,
                gamesPlayed: 3,
                bestTime: 50,
                averageTime: 75,
            });
            expect(stats.hard).toEqual({
                gamesWon: 1,
                gamesPlayed: 1,
                bestTime: 600,
                averageTime: 600,
            });
            expect(stats.overall).toEqual({
                gamesWon: 3,
                gamesPlayed: 4,
                winRate: 0.75,
            });
        });

        it("should round the average to whole seconds", () => {
            const store = useStatisticsStore();
            store.recordGame({ difficulty: "easy", elapsedSeconds: 100, completed: true });
            store.recordGame({ difficulty: "easy", elapsedSeconds: 51, completed: true });

            expect(store.statistics.easy.averageTime).toBe(76);
        });
    });

    describe("isNewBestTime", () => {
        const record = (store: ReturnType<typeof useStatisticsStore>, difficulty: "easy" | "medium", elapsedSeconds: number, completed = true) => {
            store.recordGame({ difficulty, elapsedSeconds, completed });
        };

        it("counts the first win at a difficulty as a record", () => {
            const store = useStatisticsStore();

            expect(store.isNewBestTime("easy", 300)).toBe(true);
        });

        it("counts the first win after give-ups as a record", () => {
            const store = useStatisticsStore();
            record(store, "easy", 100, false);
            record(store, "easy", 50, false);

            expect(store.isNewBestTime("easy", 300)).toBe(true);
        });

        it("counts a strictly faster time as a record", () => {
            const store = useStatisticsStore();
            record(store, "easy", 300);

            expect(store.isNewBestTime("easy", 299)).toBe(true);
            expect(store.isNewBestTime("easy", 301)).toBe(false);
        });

        it("treats a tie as no record", () => {
            const store = useStatisticsStore();
            record(store, "easy", 300);

            expect(store.isNewBestTime("easy", 300)).toBe(false);
        });

        it("ignores other difficulties", () => {
            const store = useStatisticsStore();
            record(store, "medium", 100);

            expect(store.isNewBestTime("easy", 500)).toBe(true);
        });
    });
});
