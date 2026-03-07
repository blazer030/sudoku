import Sudoku from "@/domain/Sudoku";
import PuzzleCell from "@/domain/PuzzleCell";
import type { Difficulty } from "@/domain/SudokuGenerator";

export interface CellState {
    clue: number;
    entry: number;
    notes: number[];
}

export interface GameState {
    difficulty: Difficulty;
    answer: number[][];
    cells: CellState[][];
    elapsedSeconds: number;
    completed: boolean;
    hintsUsed: number;
}

interface GameMeta {
    difficulty: Difficulty;
    elapsedSeconds: number;
    completed: boolean;
}

export const GameStateConverter = {
    toSudoku(state: GameState): Sudoku {
        const answer = state.answer.map(row => [...row]);
        const puzzle = state.cells.map(row =>
            row.map(cell => {
                const puzzleCell = new PuzzleCell(cell.clue);
                puzzleCell.restore(cell.entry, cell.notes);
                return puzzleCell;
            })
        );
        const sudoku = Sudoku.restoreSave(answer, puzzle);
        if (state.hintsUsed) {
            sudoku.hintTracker.restore(state.hintsUsed);
        }
        return sudoku;
    },

    fromSudoku(sudoku: Sudoku, meta: GameMeta): GameState {
        return {
            ...meta,
            answer: sudoku.answer.map(row => [...row]),
            cells: sudoku.puzzle.map(row =>
                row.map(cell => ({
                    clue: cell.clue,
                    entry: cell.entry,
                    notes: [...cell.notes],
                }))
            ),
            hintsUsed: sudoku.hintTracker.totalUsed,
        };
    },
};
