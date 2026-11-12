import { summarizeReplay } from "@/application/analytics/summarizeReplay";
import type { GameReplayData } from "@/domain/game/GameReplay";
import type { GameStep, GameStepAction } from "@/domain/game/GameStep";
import { createKnownSudoku, knownAnswer, knownPuzzle } from "@/__tests__/fixtures/knownPuzzle";

const buildReplay = (steps: GameStep[] = []): GameReplayData => ({
    initialBoard: knownPuzzle.map((row) => row.map((clue) => ({ clue, entry: 0, notes: [] }))),
    steps,
});

const buildStep = (action: GameStepAction, row = 0, column = 2, value = 0): GameStep => ({
    board: knownPuzzle.map((puzzleRow) => puzzleRow.map(() => ({ entry: 0, notes: [] }))),
    action,
    row,
    column,
    value,
});

// A fresh game under Auto Notes at Start: every empty cell holds its candidates on the bare clues
const buildAutoNotesReplay = (steps: GameStep[] = []): GameReplayData => {
    const sudoku = createKnownSudoku();
    sudoku.autoNotes();
    return {
        initialBoard: sudoku.puzzle.map((row) => row.map((cell) => ({ clue: cell.clue, entry: 0, notes: [...cell.notes] }))),
        steps,
    };
};

// knownAnswer[0][2] is 4, so any other digit there is wrong.
const CORRECT_VALUE = knownAnswer[0][2];
const WRONG_VALUE = CORRECT_VALUE === 1 ? 2 : 1;

describe("summarizeReplay", () => {
    it("reports zeros for a replay without steps", () => {
        expect(summarizeReplay(buildReplay(), knownAnswer)).toEqual({ undoCount: 0, wrongEntries: 0, usedNotes: 0 });
    });

    it("counts undo steps", () => {
        const replay = buildReplay([buildStep("undo"), buildStep("fill", 0, 2, CORRECT_VALUE), buildStep("undo")]);

        expect(summarizeReplay(replay, knownAnswer)?.undoCount).toBe(2);
    });

    it("counts wrong fills even when they are later undone or erased", () => {
        const replay = buildReplay([
            buildStep("fill", 0, 2, WRONG_VALUE),
            buildStep("undo"),
            buildStep("fill", 0, 2, WRONG_VALUE),
            buildStep("erase", 0, 2),
        ]);

        expect(summarizeReplay(replay, knownAnswer)?.wrongEntries).toBe(2);
    });

    it("does not count correct fills or hints", () => {
        const replay = buildReplay([buildStep("fill", 0, 2, CORRECT_VALUE), buildStep("hint", 0, 3, WRONG_VALUE)]);

        expect(summarizeReplay(replay, knownAnswer)?.wrongEntries).toBe(0);
    });

    it("flags notes use for a toggleNote step", () => {
        expect(summarizeReplay(buildReplay([buildStep("toggleNote", 0, 2, 1)]), knownAnswer)?.usedNotes).toBe(1);
    });

    it("flags notes use for an autoNotes step", () => {
        expect(summarizeReplay(buildReplay([buildStep("autoNotes")]), knownAnswer)?.usedNotes).toBe(1);
    });

    it("reports no notes use when only fills happened", () => {
        expect(summarizeReplay(buildReplay([buildStep("fill", 0, 2, CORRECT_VALUE)]), knownAnswer)?.usedNotes).toBe(0);
    });

    it("returns null when the initial board already holds a player entry", () => {
        const replay = buildReplay();
        replay.initialBoard[0][2] = { clue: 0, entry: CORRECT_VALUE, notes: [] };

        expect(summarizeReplay(replay, knownAnswer)).toBeNull();
    });

    it("returns null when the initial board already holds notes", () => {
        const replay = buildReplay();
        replay.initialBoard[0][2] = { clue: 0, entry: 0, notes: [1, 2] };

        expect(summarizeReplay(replay, knownAnswer)).toBeNull();
    });

    describe("a game started with auto notes", () => {
        it("counts undos and wrong entries, as its replay describes the whole game", () => {
            const replay = buildAutoNotesReplay([buildStep("undo"), buildStep("fill", 0, 2, WRONG_VALUE)]);

            const summary = summarizeReplay(replay, knownAnswer);

            expect(summary?.undoCount).toBe(1);
            expect(summary?.wrongEntries).toBe(1);
        });

        it("reports no notes use, whatever the player does with the notes", () => {
            const replay = buildAutoNotesReplay([buildStep("toggleNote")]);

            expect(summarizeReplay(replay, knownAnswer)?.usedNotes).toBeNull();
        });

        it("returns null when one cell lacks a candidate, as a player's own notes would", () => {
            const replay = buildAutoNotesReplay();
            replay.initialBoard[0][2].notes.pop();

            expect(summarizeReplay(replay, knownAnswer)).toBeNull();
        });

        it("returns null when the board also holds a player entry", () => {
            const replay = buildAutoNotesReplay();
            replay.initialBoard[0][2] = { clue: 0, entry: CORRECT_VALUE, notes: [] };

            expect(summarizeReplay(replay, knownAnswer)).toBeNull();
        });
    });
});
