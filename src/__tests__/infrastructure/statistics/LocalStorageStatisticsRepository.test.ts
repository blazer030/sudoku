import { LocalStorageStatisticsRepository } from "@/infrastructure/statistics/LocalStorageStatisticsRepository";

describe("LocalStorageStatisticsRepository", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("load returns empty array when no data is stored", async () => {
        const repo = new LocalStorageStatisticsRepository();
        await expect(repo.load()).resolves.toEqual([]);
    });
});
