import { beforeEach, describe, expect, it } from "vitest";
import { recordGameResult, getGameHistory, getStatistics } from "@/application/Statistics";
import type { Difficulty } from "@/domain/SudokuGenerator";

describe("Statistics", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe("recordGameResult", () => {
        it("should record completion time, difficulty, and success", () => {
            recordGameResult({
                difficulty: "easy" as Difficulty,
                elapsedSeconds: 120,
                completed: true,
            });

            const history = getGameHistory();
            expect(history).toHaveLength(1);
            expect(history[0].difficulty).toBe("easy");
            expect(history[0].elapsedSeconds).toBe(120);
            expect(history[0].completed).toBe(true);
            expect(history[0].date).toBeDefined();
        });
    });

    describe("getStatistics", () => {
        it("should return win count, best time, and average time per difficulty", () => {
            recordGameResult({ difficulty: "easy", elapsedSeconds: 120, completed: true });
            recordGameResult({ difficulty: "easy", elapsedSeconds: 180, completed: true });
            recordGameResult({ difficulty: "easy", elapsedSeconds: 60, completed: false });
            recordGameResult({ difficulty: "medium", elapsedSeconds: 300, completed: true });

            const stats = getStatistics();

            expect(stats.easy.gamesWon).toBe(2);
            expect(stats.easy.gamesPlayed).toBe(3);
            expect(stats.easy.bestTime).toBe(120);
            expect(stats.easy.averageTime).toBe(150);

            expect(stats.medium.gamesWon).toBe(1);
            expect(stats.medium.gamesPlayed).toBe(1);
            expect(stats.medium.bestTime).toBe(300);
            expect(stats.medium.averageTime).toBe(300);

            expect(stats.hard.gamesWon).toBe(0);
            expect(stats.hard.gamesPlayed).toBe(0);
            expect(stats.hard.bestTime).toBeNull();
            expect(stats.hard.averageTime).toBeNull();
        });

        it("should return empty statistics when no games played", () => {
            const stats = getStatistics();

            expect(stats.easy.gamesWon).toBe(0);
            expect(stats.easy.gamesPlayed).toBe(0);
            expect(stats.easy.bestTime).toBeNull();
            expect(stats.easy.averageTime).toBeNull();
        });

        it("should compute overall win rate across all difficulties", () => {
            recordGameResult({ difficulty: "easy", elapsedSeconds: 120, completed: true });
            recordGameResult({ difficulty: "easy", elapsedSeconds: 60, completed: false });
            recordGameResult({ difficulty: "medium", elapsedSeconds: 300, completed: true });
            recordGameResult({ difficulty: "hard", elapsedSeconds: 500, completed: false });

            const stats = getStatistics();

            expect(stats.overall.gamesWon).toBe(2);
            expect(stats.overall.gamesPlayed).toBe(4);
            expect(stats.overall.winRate).toBe(0.5);
        });

        it("should persist statistics across reloads", () => {
            recordGameResult({ difficulty: "easy", elapsedSeconds: 120, completed: true });
            recordGameResult({ difficulty: "medium", elapsedSeconds: 300, completed: false });

            // 重新讀取（模擬重新載入）
            const stats = getStatistics();

            expect(stats.easy.gamesWon).toBe(1);
            expect(stats.medium.gamesPlayed).toBe(1);
            expect(stats.overall.gamesPlayed).toBe(2);
        });

        it("should return recent games in reverse chronological order", () => {
            recordGameResult({ difficulty: "easy", elapsedSeconds: 120, completed: true });
            recordGameResult({ difficulty: "medium", elapsedSeconds: 200, completed: false });
            recordGameResult({ difficulty: "hard", elapsedSeconds: 300, completed: true });

            const stats = getStatistics();

            expect(stats.recentGames).toHaveLength(3);
            expect(stats.recentGames[0].difficulty).toBe("hard");
            expect(stats.recentGames[1].difficulty).toBe("medium");
            expect(stats.recentGames[2].difficulty).toBe("easy");
        });
    });
});
