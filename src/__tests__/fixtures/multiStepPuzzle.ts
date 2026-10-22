import { Sudoku } from "@/domain/game/Sudoku";
import { PuzzleCell } from "@/domain/board/PuzzleCell";
import { BoardState } from "@/domain/solver/BoardState";
import { TechniqueSolver } from "@/domain/solver/TechniqueSolver";
import { SAMPLE_PUZZLES } from "@/presentation/pages/solver-walkthrough/samplePuzzles";

/**
 * Returns the "Hard" walkthrough puzzle, played forward with correct entries until the next
 * Reveal Cell hint needs elimination steps before its assignment.
 */
export const createMultiStepSudoku = (): Sudoku => {
    const hardPreset = SAMPLE_PUZZLES.find((sample) => sample.id === "hard");
    if (!hardPreset) throw new Error("Hard preset missing");
    const solved = new TechniqueSolver().solveWithTechniques(BoardState.fromPuzzle(hardPreset.puzzle));
    const answer = hardPreset.puzzle.map((rowValues, row) =>
        rowValues.map((_, column) => solved.finalState.valueAt(row, column)));
    const sudoku = Sudoku.restoreSave(answer, hardPreset.puzzle.map((rowValues) =>
        rowValues.map((value) => new PuzzleCell(value))));

    for (;;) {
        const plan = sudoku.planRevealHint();
        if (plan.kind !== "steps") throw new Error("no multi-step hint found");
        if (plan.steps.length > 1) return sudoku;
        sudoku.fill(plan.target.row, plan.target.column, plan.digit);
    }
};
