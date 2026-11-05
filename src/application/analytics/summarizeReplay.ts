import { PuzzleCell } from "@/domain/board/PuzzleCell";
import { Sudoku } from "@/domain/game/Sudoku";
import type { GameReplayData } from "@/application/statistics/StatisticsRepository";

export interface ReplaySummary {
    undoCount: number;
    wrongEntries: number;
    /** null when the game started with every note in place, which says nothing of whether the player uses them. */
    usedNotes: 0 | 1 | null;
}

const sameDigits = (first: readonly number[], second: readonly number[]): boolean =>
    [...first].sort().join() === [...second].sort().join();

// Auto Notes at Start leaves each empty cell holding all its candidates on the bare clues
const holdsAutoNotes = (initialBoard: GameReplayData["initialBoard"], answer: readonly (readonly number[])[]): boolean => {
    const fresh = Sudoku.restoreSave(
        answer.map((row) => [...row]),
        initialBoard.map((row) => row.map((cell) => new PuzzleCell(cell.clue))),
    );
    fresh.autoNotes();
    return initialBoard.every((row, rowIndex) => row.every((cell, column) => sameDigits(cell.notes, fresh.puzzle[rowIndex][column].notes)));
};

// A replay that does not begin from a fresh board (a game resumed from a save without history)
// cannot describe the whole game, so it yields no summary instead of partial counts.
export const summarizeReplay = (replay: GameReplayData, answer: readonly (readonly number[])[]): ReplaySummary | null => {
    const emptyCells = replay.initialBoard.flat().filter((cell) => cell.clue === 0);
    if (emptyCells.some((cell) => cell.entry !== 0)) return null;
    const startedWithNotes = emptyCells.some((cell) => cell.notes.length > 0);
    if (startedWithNotes && !holdsAutoNotes(replay.initialBoard, answer)) return null;

    let undoCount = 0;
    let wrongEntries = 0;
    let usedNotes: 0 | 1 = 0;
    replay.steps.forEach((step) => {
        if (step.action === "undo") undoCount += 1;
        if (step.action === "fill" && step.value !== answer[step.row][step.column]) wrongEntries += 1;
        if (step.action === "toggleNote" || step.action === "autoNotes") usedNotes = 1;
    });
    return { undoCount, wrongEntries, usedNotes: startedWithNotes ? null : usedNotes };
};
