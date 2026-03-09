import { BOARD_SIZE, BOX_SIZE } from "@/domain/constants";

export interface Conflict {
    row: number;
    column: number;
}

export class ConflictDetector {
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
