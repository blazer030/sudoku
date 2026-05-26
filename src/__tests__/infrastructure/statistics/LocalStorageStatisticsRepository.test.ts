import { LocalStorageStatisticsRepository } from "@/infrastructure/statistics/LocalStorageStatisticsRepository";
import type { GameResult } from "@/application/statistics/StatisticsRepository";

const sampleGame: GameResult = {
    difficulty: "easy",
    elapsedSeconds: 123,
    completed: true,
    date: "2026-05-26T00:00:00.000Z",
    hintsUsed: 1,
};

describe("LocalStorageStatisticsRepository", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("load returns empty array when no data is stored", async () => {
        const repo = new LocalStorageStatisticsRepository();
        await expect(repo.load()).resolves.toEqual([]);
    });

    it("save then load roundtrips the history", async () => {
        const repo = new LocalStorageStatisticsRepository();
        await repo.save([sampleGame]);
        await expect(repo.load()).resolves.toEqual([sampleGame]);
    });

    it("load fills missing hintsUsed with 0 for backward compatibility", async () => {
        localStorage.setItem("sudoku-statistics", JSON.stringify([{ ...sampleGame, hintsUsed: undefined }]));
        const repo = new LocalStorageStatisticsRepository();
        const result = await repo.load();
        expect(result[0].hintsUsed).toBe(0);
    });

    it("clear removes stored history", async () => {
        const repo = new LocalStorageStatisticsRepository();
        await repo.save([sampleGame]);
        await repo.clear();
        await expect(repo.load()).resolves.toEqual([]);
    });
});
