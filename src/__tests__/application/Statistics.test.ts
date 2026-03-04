import { beforeEach, describe, expect, it } from "vitest";
import { recordGameResult, getGameHistory } from "@/application/Statistics";
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
});
