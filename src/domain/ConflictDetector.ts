export interface Conflict {
    row: number;
    column: number;
}

export class ConflictDetector {
    findConflicts(board: number[][], row: number, column: number, value: number): Conflict[] {
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

        return conflicts;
    }
}
