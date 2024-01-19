import Sudoku from "@/domain/Sudoku";
import { useState } from "react";
import PuzzleCell from "@/domain/PuzzleCell";

export const Game = () => {
    const sudoku = new Sudoku();
    const [puzzle] = useState<PuzzleCell[][]>(sudoku.generate());


    return <div>
        {
            puzzle.map((row, rowIndex) => {
                return <div key={rowIndex} className="flex">
                    {
                        row.map((cell, colIndex) => {
                            return <div key={`cell-${rowIndex}-${colIndex}`} className="flex-1 border border-gray-300">
                                {cell.value}
                            </div>;
                        })
                    }
                </div>;
            })
        }
    </div>;
};

export default Game;
