import Sudoku from "@/domain/Sudoku";
import PuzzleCell from "@/domain/PuzzleCell";
import type { Difficulty } from "@/domain/SudokuGenerator";
import type { GameState } from "@/application/GameState";

interface GameMeta {
    difficulty: Difficulty;
    elapsedSeconds: number;
    completed: boolean;
}

export function toSudoku(state: GameState): Sudoku {
    const answer = state.answer.map(row => [...row]);
    const puzzle = state.cells.map(row =>
        row.map(cell => {
            const puzzleCell = new PuzzleCell(cell.value);
            puzzleCell.restore(cell.input, cell.notes);
            return puzzleCell;
        })
    );
    return Sudoku.restoreSave(answer, puzzle);
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
