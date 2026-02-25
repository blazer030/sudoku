import { solve } from "@/domain/SudokuSolver";

export function generateFullBoard(): number[][] {
    const emptyBoard = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
    return solve(emptyBoard)!;
}
