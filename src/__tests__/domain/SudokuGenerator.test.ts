import { describe, expect, it } from "vitest";
import { generateFullBoard } from "@/domain/SudokuGenerator";

describe("SudokuGenerator", () => {
    it("should generate a 9x9 board", () => {
        const board = generateFullBoard();

        expect(board).toHaveLength(9);
        board.forEach(row => {
            expect(row).toHaveLength(9);
        });
    });
});
