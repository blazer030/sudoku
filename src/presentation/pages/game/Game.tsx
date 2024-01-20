import Sudoku from "@/domain/Sudoku";
import React, { useState } from "react";
import PuzzleCell from "@/domain/PuzzleCell";
import Button from "@/presentation/components/ui/button/button";

interface PuzzleBoxProps {
    puzzleCell: PuzzleCell;
}

const PuzzleBox: React.FC<PuzzleBoxProps> = ({ puzzleCell }) => {
    if (puzzleCell.isTip) {
        return <div className="text-black text-2xl">
            {puzzleCell.value}
        </div>;
    }

    if (puzzleCell.isEntered) {
        return <div className="text-sky-200 text-2xl">
            {puzzleCell.input}
        </div>;
    }

    if (puzzleCell.hasNotes) {
        return <div className="flex flex-wrap p-1">
            {
                puzzleCell.notes.map((note, index) => {
                    return <div
                        key={`note-${index}`}
                        className="w-1/3 flex justify-center items-center text-xs text-gray-400 aspect-square"
                    >
                        {note}
                    </div>;
                })
            }
        </div>
    }

    return null;
};

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
                            row.map((puzzleCell, colIndex) => {
                                return <div
                                    key={`cell-${rowIndex}-${colIndex}`}
                                    className="flex justify-center items-center flex-1 aspect-square border-sky-200 [&:not(:nth-child(3n+1))]:border-l-2 last:border-r-2 first:border-l-4 [&:nth-child(3n)]:border-r-4"
                                >
                                    <PuzzleBox puzzleCell={puzzleCell} />
                                </div>;
                            })
                        }
                    </div>;
                })
            }
        </div>
        <div className="flex justify-center px-4 gap-2 mb-4">
            <Button variant="outline">Undo</Button>
            <Button variant="outline">Erase</Button>
            <Button variant="outline">Note</Button>
        </div>
        <div className="flex px-4 gap-2">
            {
                Array.from({ length: 9 }).map((_, index) => {
                    return <div key={`note-${index}`} className="flex-1 aspect-square">
                        <Button
                            variant="outline"
                            className="w-full h-full text-2xl rounded-full"
                        >
                            {index + 1}
                        </Button>
                    </div>;
                })
            }
        </div>
    </div>;
};

export default Game;
