import { computeAbandonProgress } from "@/application/analytics/computeAbandonProgress";

const ANSWER: number[][] = Array.from({ length: 9 }, (_, row) => Array.from({ length: 9 }, (_, column) => ((row * 3 + Math.floor(row / 3) + column) % 9) + 1));

interface Cell {
    clue: number;
    entry: number;
}

const buildPuzzle = (decorate: (row: number, column: number) => Cell): Cell[][] =>
    ANSWER.map((answerRow, row) => answerRow.map((_, column) => decorate(row, column)));

describe("computeAbandonProgress", () => {
    it("reports 0/0/0 when the player has entered nothing", () => {
        const puzzle = buildPuzzle((row, column) => ({ clue: row === 0 ? ANSWER[row][column] : 0, entry: 0 }));

        expect(computeAbandonProgress(puzzle, ANSWER)).toEqual({ progressPct: 0, correctPct: 0, incorrectPct: 0 });
    });

    it("reports 50/50/0 when half of the empty cells are correct", () => {
        // Rows 0-1 are empty cells here (18); fill 9 of them correctly.
        const puzzle = buildPuzzle((row, column) => {
            if (row >= 2) return { clue: ANSWER[row][column], entry: 0 };
            return { clue: 0, entry: row === 0 ? ANSWER[row][column] : 0 };
        });

        expect(computeAbandonProgress(puzzle, ANSWER)).toEqual({ progressPct: 50, correctPct: 50, incorrectPct: 0 });
    });

    it("splits correct and incorrect entries", () => {
        // 10 empty cells: 5 correct, 2 wrong, 3 untouched.
        const puzzle: Cell[][] = ANSWER.map((answerRow, row) => answerRow.map((value, column) => {
            const slotIndex = row * 9 + column;
            if (slotIndex >= 10) return { clue: value, entry: 0 };
            if (slotIndex < 5) return { clue: 0, entry: value };
            if (slotIndex < 7) return { clue: 0, entry: (value % 9) + 1 };
            return { clue: 0, entry: 0 };
        }));

        expect(computeAbandonProgress(puzzle, ANSWER)).toEqual({ progressPct: 70, correctPct: 50, incorrectPct: 20 });
    });

    it("ignores clue cells even though they carry values", () => {
        const puzzle = buildPuzzle((row, column) => ({ clue: ANSWER[row][column], entry: 0 }));
        puzzle[0][0] = { clue: 0, entry: ANSWER[0][0] };

        expect(computeAbandonProgress(puzzle, ANSWER)).toEqual({ progressPct: 100, correctPct: 100, incorrectPct: 0 });
    });

    it("reports 0/0/0 when there are no empty cells", () => {
        const puzzle = buildPuzzle((row, column) => ({ clue: ANSWER[row][column], entry: 0 }));

        expect(computeAbandonProgress(puzzle, ANSWER)).toEqual({ progressPct: 0, correctPct: 0, incorrectPct: 0 });
    });
});
