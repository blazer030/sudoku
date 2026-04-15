import { beforeEach, describe, expect, it } from "vitest";
import { recordGameResult, getGameHistory, getStatistics, clearAllRecords } from "@/application/Statistics";

describe("Statistics", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe("recordGameResult", () => {
        it("should record completion time, difficulty, and success", () => {
            recordGameResult({
                difficulty: "easy",
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

    describe("clearAllRecords", () => {
        it("should remove all game history from localStorage", () => {
            recordGameResult({ difficulty: "easy", elapsedSeconds: 120, completed: true });
            recordGameResult({ difficulty: "medium", elapsedSeconds: 200, completed: false });

            clearAllRecords();

            expect(getGameHistory()).toHaveLength(0);
            expect(getStatistics().overall.gamesPlayed).toBe(0);
        });
    });

    describe("hintsUsed tracking", () => {
        it("recordGameResult should accept hintsUsed field", () => {
            recordGameResult({
                difficulty: "easy",
                elapsedSeconds: 120,
                completed: true,
                hintsUsed: 2,
            });

            const history = getGameHistory();
            expect(history[0].hintsUsed).toBe(2);
        });

        it("recentGames should include hintsUsed", () => {
            recordGameResult({ difficulty: "easy", elapsedSeconds: 120, completed: true, hintsUsed: 1 });
            recordGameResult({ difficulty: "medium", elapsedSeconds: 200, completed: true, hintsUsed: 3 });

            const stats = getStatistics();

            expect(stats.recentGames[0].hintsUsed).toBe(3);
            expect(stats.recentGames[1].hintsUsed).toBe(1);
        });

        it("old data without hintsUsed should default to 0", () => {
            // 模擬舊資料（沒有 hintsUsed）
            localStorage.setItem("sudoku-statistics", JSON.stringify([
                { difficulty: "easy", elapsedSeconds: 100, completed: true, date: "2024-01-01" },
            ]));

            const stats = getStatistics();

            expect(stats.recentGames[0].hintsUsed).toBe(0);
        });
    });

    describe("replay data", () => {
        it("should store and retrieve replay data with game result", () => {
            const replay = {
                initialBoard: Array.from({ length: 9 }, () =>
                    Array.from({ length: 9 }, () => ({ clue: 0, entry: 0, notes: [] as number[] }))
                ),
                steps: [
                    {
                        board: Array.from({ length: 9 }, () =>
                            Array.from({ length: 9 }, () => ({ entry: 0, notes: [] as number[] }))
                        ),
                        action: "fill" as const,
                        row: 2,
                        column: 4,
                        value: 6,
                    },
                ],
            };

            recordGameResult({
                difficulty: "easy",
                elapsedSeconds: 120,
                completed: true,
                replay,
            });

            const history = getGameHistory();
            const savedReplay = history[0].replay;
            expect(savedReplay).toBeDefined();
            expect(savedReplay?.steps).toHaveLength(1);
            expect(savedReplay?.steps[0].action).toBe("fill");
            expect(savedReplay?.initialBoard[0][0].clue).toBe(0);
        });

        it("old data without replay should have undefined replay", () => {
            localStorage.setItem("sudoku-statistics", JSON.stringify([
                { difficulty: "easy", elapsedSeconds: 100, completed: true, date: "2024-01-01", hintsUsed: 0 },
            ]));

            const history = getGameHistory();
            expect(history[0].replay).toBeUndefined();
        });
    });
});
