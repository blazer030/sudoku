import { BOARD_SIZE } from "@/domain/board/constants";
import type { LessonBoard } from "@/domain/lessons/Lesson";
import { BoardState } from "@/domain/solver/BoardState";

export const boardGrid = (board: LessonBoard): number[][] => {
    const grid: number[][] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        const digits: number[] = [];
        for (let column = 0; column < BOARD_SIZE; column++) digits.push(Number(board.values[row * BOARD_SIZE + column]));
        grid.push(digits);
    }
    return grid;
};

/** The board as the solver sees it: its digits, and every candidate left once the removed ones are gone. */
export const boardState = (board: LessonBoard): BoardState =>
    (board.removedCandidates ?? []).reduce(
        (state, { cell, digit }) => state.eliminate(cell.row, cell.column, digit),
        BoardState.fromPuzzle(boardGrid(board)),
    );
