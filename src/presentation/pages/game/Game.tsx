import Sudoku from "@/domain/Sudoku";
import { useState } from "react";
import PuzzleCell from "@/domain/PuzzleCell";

export const Game = () => {
    const sudoku = new Sudoku();
    const [puzzle] = useState<PuzzleCell[][]>(sudoku.generate());


    return <div>
        <div className="p-4 text-center">This is Navbar</div>
        <div className="my-9">
            {
                puzzle.map((row, rowIndex) => {
                    return <div
                        key={rowIndex}
                        className="flex border-sky-200 [&:not(:nth-child(3n+1))]:border-t-2 last:border-b-2 first:border-t-4 [&:nth-child(3n)]:border-b-4"
                    >
                        {
                            row.map((cell, colIndex) => {
                                return <div
                                    key={`cell-${rowIndex}-${colIndex}`}
                                    className="flex justify-center items-center flex-1 aspect-square border-sky-200 [&:not(:nth-child(3n+1))]:border-l-2 last:border-r-2 first:border-l-4 [&:nth-child(3n)]:border-r-4"
                                >
                                    {cell.value}
                                </div>;
                            })
                        }
                    </div>;
                })
            }
        </div>
    </div>;
};

export default Game;
