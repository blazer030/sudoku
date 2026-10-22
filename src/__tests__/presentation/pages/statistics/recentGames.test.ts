import { describe, expect, it } from "vitest";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import type { GameResult } from "@/application/statistics/StatisticsRepository";
import { listRecentGames } from "@/presentation/pages/statistics/recentGames";

const game = (difficulty: Difficulty): GameResult => ({
    difficulty,
    elapsedSeconds: 100,
    completed: true,
    date: "2026-10-22T04:00:00.000Z",
    hintsUsed: 0,
});

describe("listRecentGames", () => {
    it("should list the newest game first with its history index", () => {
        const history = [game("easy"), game("medium"), game("hard")];

        const recentGames = listRecentGames(history, "all");

        expect(recentGames.map(item => item.game.difficulty)).toEqual(["hard", "medium", "easy"]);
        expect(recentGames.map(item => item.historyIndex)).toEqual([2, 1, 0]);
    });

    it("should keep history indexes when filtered", () => {
        const history = [game("easy"), game("hard"), game("easy")];

        expect(listRecentGames(history, "easy").map(item => item.historyIndex)).toEqual([2, 0]);
        expect(listRecentGames(history, "medium")).toEqual([]);
    });
});
