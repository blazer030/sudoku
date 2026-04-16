import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";

const ALL_DIGITS_MASK = 0b111111111;

export class BoardState {
    private constructor(
        private readonly _candidates: number[][],
    ) {}

    public static fromPuzzle(puzzle: number[][]): BoardState {
        const candidates: number[][] = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            const rowCandidates: number[] = [];
            for (let column = 0; column < BOARD_SIZE; column++) {
                if (puzzle[row][column] !== 0) {
                    rowCandidates.push(0);
                } else {
                    rowCandidates.push(BoardState.computeCandidates(puzzle, row, column));
                }
            }
            candidates.push(rowCandidates);
        }
        return new BoardState(candidates);
    }

    public candidatesOf(row: number, column: number): number[] {
        const candidateMask = this._candidates[row][column];
        const digits: number[] = [];
        for (let digit = 1; digit <= BOARD_SIZE; digit++) {
            if ((candidateMask & (1 << (digit - 1))) !== 0) {
                digits.push(digit);
            }
        }
        return digits;
    }

    private static computeCandidates(puzzle: number[][], row: number, column: number): number {
        let candidateMask = ALL_DIGITS_MASK;
        for (let index = 0; index < BOARD_SIZE; index++) {
            candidateMask = BoardState.removeDigit(candidateMask, puzzle[row][index]);
            candidateMask = BoardState.removeDigit(candidateMask, puzzle[index][column]);
        }
        const boxStartRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
        const boxStartColumn = Math.floor(column / BOX_SIZE) * BOX_SIZE;
        for (let boxRow = boxStartRow; boxRow < boxStartRow + BOX_SIZE; boxRow++) {
            for (let boxColumn = boxStartColumn; boxColumn < boxStartColumn + BOX_SIZE; boxColumn++) {
                candidateMask = BoardState.removeDigit(candidateMask, puzzle[boxRow][boxColumn]);
            }
        }
        return candidateMask;
    }

    private static removeDigit(candidateMask: number, digit: number): number {
        if (digit === 0) return candidateMask;
        return candidateMask & ~(1 << (digit - 1));
    }
}
