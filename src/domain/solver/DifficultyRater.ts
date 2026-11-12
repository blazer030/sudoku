import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import { BoardState } from "@/domain/solver/BoardState";
import { TECHNIQUE_IDS_BY_DIFFICULTY, createTechniques, findFirstStep } from "@/domain/solver/techniqueRegistry";
import type { Technique } from "@/domain/solver/techniques/Technique";

const MAX_SOLVE_ITERATIONS = 200;

const easyTechniques = (): Technique[] => createTechniques(TECHNIQUE_IDS_BY_DIFFICULTY.easy);
const mediumTechniques = (): Technique[] => createTechniques(TECHNIQUE_IDS_BY_DIFFICULTY.medium);
const hardTechniques = (): Technique[] => createTechniques(TECHNIQUE_IDS_BY_DIFFICULTY.hard);

export class DifficultyRater {
    public rate(puzzle: number[][]): Difficulty | null {
        if (canSolveWith(puzzle, easyTechniques())) return "easy";
        if (canSolveWith(puzzle, mediumTechniques())) return "medium";
        if (canSolveWith(puzzle, hardTechniques())) return "hard";
        return null;
    }

    public matches(puzzle: number[][], target: Difficulty): boolean {
        if (target === "easy") {
            return canSolveWith(puzzle, easyTechniques());
        }
        if (target === "medium") {
            return canSolveWith(puzzle, mediumTechniques()) && !canSolveWith(puzzle, easyTechniques());
        }
        return canSolveWith(puzzle, hardTechniques()) && !canSolveWith(puzzle, mediumTechniques());
    }
}

function canSolveWith(puzzle: number[][], techniques: Technique[]): boolean {
    let state = BoardState.fromPuzzle(puzzle);
    for (let iteration = 0; iteration < MAX_SOLVE_ITERATIONS; iteration++) {
        if (state.isSolved()) return true;
        const step = findFirstStep(state, techniques);
        if (step === null) return false;
        state = state.apply(step);
    }
    return false;
}
