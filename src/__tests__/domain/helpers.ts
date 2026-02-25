function hasAllDigits(numbers: number[]): boolean {
    return new Set(numbers).size === 9
        && numbers.every(number => number >= 1 && number <= 9);
}

export function isValidSolution(board: number[][]): boolean {
    for (let index = 0; index < 9; index++) {
        const row = board[index];
        const column = board.map(row => row[index]);
        const boxRowStart = Math.floor(index / 3) * 3;
        const boxColStart = (index % 3) * 3;
        const box = [];
        for (let row = boxRowStart; row < boxRowStart + 3; row++) {
            for (let col = boxColStart; col < boxColStart + 3; col++) {
                box.push(board[row][col]);
            }
        }
        if (!hasAllDigits(row) || !hasAllDigits(column) || !hasAllDigits(box)) {
            return false;
        }
    }
    return true;
}
