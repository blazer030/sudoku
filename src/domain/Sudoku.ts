import PuzzleCell from "@/domain/PuzzleCell";

class Sudoku {
    private puzzle: PuzzleCell[][] = [];

    public generate() {
        const solution = [
            [4, 9, 6, 7, 5, 1, 8, 2, 3],
            [2, 1, 8, 6, 9, 3, 7, 5, 4],
            [7, 5, 3, 4, 8, 2, 1, 6, 9],
            [1, 8, 5, 3, 6, 7, 4, 9, 2],
            [9, 6, 2, 5, 1, 4, 3, 8, 7],
            [3, 7, 4, 8, 2, 9, 5, 1, 6],
            [5, 3, 1, 2, 7, 6, 9, 4, 8],
            [6, 4, 9, 1, 3, 8, 2, 7, 5],
            [8, 2, 7, 9, 4, 5, 6, 3, 1]
        ];

        const puzzle = [
            [4, 9, 0, 0, 0, 0, 8, 0, 0],
            [2, 0, 0, 0, 9, 0, 0, 0, 4],
            [0, 0, 3, 0, 0, 2, 0, 6, 0],
            [0, 0, 5, 3, 0, 0, 0, 0, 2],
            [0, 0, 0, 5, 0, 4, 0, 0, 0],
            [3, 0, 4, 0, 0, 9, 5, 0, 0],
            [5, 0, 0, 0, 7, 0, 9, 0, 8],
            [0, 0, 9, 0, 0, 8, 0, 0, 5],
            [0, 0, 8, 0, 0, 0, 0, 3, 1]
        ];

        this.puzzle = solution.map((row, rowIndex) => {
            return row.map((answer, columnIndex) => {
                const isHole = puzzle[rowIndex][columnIndex] === 0;
                return new PuzzleCell(answer, isHole);
            })
        });

        return this.puzzle;
    }
}

export default Sudoku;
