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
        const mask = this._candidates[row][column];
        const result: number[] = [];
        for (let digit = 1; digit <= BOARD_SIZE; digit++) {
            if ((mask & (1 << (digit - 1))) !== 0) {
                result.push(digit);
            }
        }
        return result;
    }

    private static computeCandidates(puzzle: number[][], row: number, column: number): number {
        let mask = ALL_DIGITS_MASK;
        for (let i = 0; i < BOARD_SIZE; i++) {
            mask = BoardState.removeDigit(mask, puzzle[row][i]);
            mask = BoardState.removeDigit(mask, puzzle[i][column]);
        }
        const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
        const boxColumn = Math.floor(column / BOX_SIZE) * BOX_SIZE;
        for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
            for (let c = boxColumn; c < boxColumn + BOX_SIZE; c++) {
                mask = BoardState.removeDigit(mask, puzzle[r][c]);
            }
        }
        return mask;
    }

    private static removeDigit(mask: number, digit: number): number {
        if (digit === 0) return mask;
        return mask & ~(1 << (digit - 1));
    }
}
