import { Sudoku } from "@/domain/game/Sudoku";
import { PuzzleCell } from "@/domain/board/PuzzleCell";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import { boardStateOf, type CellState } from "@/domain/board/cellState";
import type { GameReplayData } from "@/domain/game/GameReplay";

export interface GameState {
    difficulty: Difficulty;
    answer: number[][];
    cells: CellState[][];
    elapsedSeconds: number;
    completed: boolean;
    hintsUsed: number;
    // Absent in saves from 2.0.0 and earlier
    replay?: GameReplayData;
}

interface GameMeta {
    difficulty: Difficulty;
    elapsedSeconds: number;
    completed: boolean;
    replay?: GameReplayData;
}

export const GameStateConverter = {
    toSudoku(state: GameState): Sudoku {
        const answer = state.answer.map(row => [...row]);
        const puzzle = state.cells.map(row => row.map(cell => PuzzleCell.fromState(cell)));
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
            cells: boardStateOf(sudoku.puzzle),
            hintsUsed: sudoku.hintTracker.totalUsed,
        };
    },
};

export const captureInitialBoard = (sudoku: Sudoku): CellState[][] => boardStateOf(sudoku.puzzle);
