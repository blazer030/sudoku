import PuzzleCell from "@/domain/PuzzleCell";

class Sudoku {
    private _answer: number[][] = [];
    private _puzzle: PuzzleCell[][] = [];

    public generate() {
        this._answer = [
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
            [8, 0, 0, 0, 0, 0, 0, 3, 1]
        ];

        this._puzzle = puzzle.map((row) => {
            return row.map((value) => {
                return new PuzzleCell(value);
            })
        });

        return this._puzzle;
    }

    public check(row: number, column: number, value: number): boolean {
        return this._answer[row][column] === value;
    }
}

export default Sudoku;
