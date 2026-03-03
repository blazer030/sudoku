import type Sudoku from "@/domain/Sudoku";
import type { Difficulty } from "@/domain/SudokuGenerator";
import type { GameState } from "@/application/GameState";

interface GameMeta {
    difficulty: Difficulty;
    elapsedSeconds: number;
    completed: boolean;
}

export function toGameState(sudoku: Sudoku, meta: GameMeta): GameState {
    return {
        ...meta,
        answer: sudoku.answer.map(row => [...row]),
        cells: sudoku.puzzle.map(row =>
            row.map(cell => ({
                value: cell.value,
                input: cell.input,
                notes: [...cell.notes],
            }))
        ),
    };
}
