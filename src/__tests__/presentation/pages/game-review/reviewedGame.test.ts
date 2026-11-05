import { describe, expect, it } from "vitest";
import type { GameResult } from "@/application/statistics/StatisticsRepository";
import { findReviewedGame } from "@/presentation/pages/game-review/reviewedGame";

const replay = { initialBoard: [], steps: [] };
const recorded: GameResult = { difficulty: "easy", elapsedSeconds: 60, completed: true, date: "2026-10-31T00:00:00.000Z", hintsUsed: 0, replay };

describe("findReviewedGame", () => {
    it("should find the game at the index", () => {
        expect(findReviewedGame([recorded], "0")).toBe(recorded);
    });

    it.each(["1", "99", "-1", "abc", "1.5", "", " 0", "0x0", "1e0"])("should find no game for index %j in a one-game history", (index) => {
        expect(findReviewedGame([recorded], index)).toBeNull();
    });

    it("should find no game for a record kept without its replay", () => {
        expect(findReviewedGame([{ ...recorded, replay: undefined }], "0")).toBeNull();
    });
});
