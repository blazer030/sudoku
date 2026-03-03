export interface Conflict {
    row: number;
    column: number;
}

export class ConflictDetector {
    public findConflicts(board: number[][], row: number, column: number, value: number): Conflict[] {
        const conflicts: Conflict[] = [];

        for (let currentColumn = 0; currentColumn < 9; currentColumn++) {
            if (currentColumn !== column && board[row][currentColumn] === value) {
                conflicts.push({ row, column: currentColumn });
            }
        }

        for (let currentRow = 0; currentRow < 9; currentRow++) {
            if (currentRow !== row && board[currentRow][column] === value) {
                conflicts.push({ row: currentRow, column });
            }
        }

        const boxRowStart = Math.floor(row / 3) * 3;
        const boxColumnStart = Math.floor(column / 3) * 3;
        for (let currentRow = boxRowStart; currentRow < boxRowStart + 3; currentRow++) {
            for (let currentColumn = boxColumnStart; currentColumn < boxColumnStart + 3; currentColumn++) {
                if (currentRow !== row && currentColumn !== column && board[currentRow][currentColumn] === value) {
                    conflicts.push({ row: currentRow, column: currentColumn });
                }
            }
        }

        return conflicts;
    }
}
