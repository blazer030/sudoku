import { BOARD_SIZE, BOX_SIZE } from "@/domain/constants";
import PuzzleCell from "@/domain/PuzzleCell";

export interface Conflict {
    row: number;
    column: number;
}

export class ConflictDetector {
    public findAllConflicts(puzzle: PuzzleCell[][], board: number[][]): Conflict[] {
        const conflicts: Conflict[] = [];
        const seen = new Set<string>();

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let column = 0; column < BOARD_SIZE; column++) {
                const cell = puzzle[row][column];
                if (cell.isClue || !cell.hasEntry) continue;
                const value = cell.entry;
                const cellConflicts = this.findConflicts(board, row, column, value);
                for (const conflict of cellConflicts) {
                    const key = `${conflict.row},${conflict.column}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        conflicts.push(conflict);
                    }
                }
                if (cellConflicts.length > 0) {
                    const selfKey = `${row},${column}`;
                    if (!seen.has(selfKey)) {
                        seen.add(selfKey);
                        conflicts.push({ row, column });
                    }
                }
            }
        }
        return conflicts;
    }

    public findErrors(puzzle: PuzzleCell[][], answer: number[][]): Conflict[] {
        const errors: Conflict[] = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let column = 0; column < BOARD_SIZE; column++) {
                const cell = puzzle[row][column];
                if (cell.isClue || !cell.hasEntry) continue;
                if (cell.entry !== answer[row][column]) {
                    errors.push({ row, column });
                }
            }
        }
        return errors;
    }

    public findConflicts(board: number[][], row: number, column: number, value: number): Conflict[] {
        const conflicts: Conflict[] = [];

        for (let currentColumn = 0; currentColumn < BOARD_SIZE; currentColumn++) {
            if (currentColumn !== column && board[row][currentColumn] === value) {
                conflicts.push({ row, column: currentColumn });
            }
        }

        for (let currentRow = 0; currentRow < BOARD_SIZE; currentRow++) {
            if (currentRow !== row && board[currentRow][column] === value) {
                conflicts.push({ row: currentRow, column });
            }
        }

        const boxRowStart = Math.floor(row / BOX_SIZE) * BOX_SIZE;
        const boxColumnStart = Math.floor(column / BOX_SIZE) * BOX_SIZE;
        for (let currentRow = boxRowStart; currentRow < boxRowStart + BOX_SIZE; currentRow++) {
            for (let currentColumn = boxColumnStart; currentColumn < boxColumnStart + BOX_SIZE; currentColumn++) {
                if (currentRow !== row && currentColumn !== column && board[currentRow][currentColumn] === value) {
                    conflicts.push({ row: currentRow, column: currentColumn });
                }
            }
        }

        return conflicts;
    }
}
