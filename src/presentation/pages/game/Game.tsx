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
                        row.map((cell, cellIndex) => {
                            return <div key={cellIndex} className="flex-1 border border-gray-300">
                                {cell.isHole ? "" : cell.answer}
                            </div>;
                        })
                    }
                </div>;
            })
        }
    </div>;
};

export default Game;
