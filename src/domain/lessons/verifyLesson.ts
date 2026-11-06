import { BOARD_SIZE } from "@/domain/board/constants";
import { SudokuSolver } from "@/domain/generator/SudokuSolver";
import { boardGrid, boardState } from "@/domain/lessons/lessonBoard";
import type { LessonBoard, LessonStep } from "@/domain/lessons/Lesson";
import { sameCell } from "@/domain/solver/cellRelations";
import type { CellReference, Elimination, TechniqueId } from "@/domain/solver/SolveStep";
import { Claiming } from "@/domain/solver/techniques/Claiming";
import { Fish } from "@/domain/solver/techniques/Fish";
import { HiddenSingle } from "@/domain/solver/techniques/HiddenSingle";
import { HiddenSubset } from "@/domain/solver/techniques/HiddenSubset";
import { NakedSingle } from "@/domain/solver/techniques/NakedSingle";
import { NakedSubset } from "@/domain/solver/techniques/NakedSubset";
import { Pointing } from "@/domain/solver/techniques/Pointing";
import type { Technique } from "@/domain/solver/techniques/Technique";
import { WWing } from "@/domain/solver/techniques/WWing";
import { WXYZWing } from "@/domain/solver/techniques/WXYZWing";
import { XChain } from "@/domain/solver/techniques/XChain";
import { XYChain } from "@/domain/solver/techniques/XYChain";
import { XYWing } from "@/domain/solver/techniques/XYWing";
import { XYZWing } from "@/domain/solver/techniques/XYZWing";

const TECHNIQUES: Record<TechniqueId, () => Technique> = {
    nakedSingle: () => new NakedSingle(),
    hiddenSingle: () => new HiddenSingle(),
    nakedPair: () => new NakedSubset(2),
    nakedTriple: () => new NakedSubset(3),
    nakedQuad: () => new NakedSubset(4),
    hiddenPair: () => new HiddenSubset(2),
    hiddenTriple: () => new HiddenSubset(3),
    hiddenQuad: () => new HiddenSubset(4),
    pointing: () => new Pointing(),
    claiming: () => new Claiming(),
    xWing: () => new Fish(2),
    swordfish: () => new Fish(3),
    jellyfish: () => new Fish(4),
    xyWing: () => new XYWing(),
    wWing: () => new WWing(),
    xyzWing: () => new XYZWing(),
    wxyzWing: () => new WXYZWing(),
    xChain: () => new XChain(),
    xyChain: () => new XYChain(),
};

const sameElimination = (first: Elimination, second: Elimination): boolean =>
    first.digit === second.digit && sameCell(first.cell, second.cell);

const sameEliminations = (first: readonly Elimination[], second: readonly Elimination[]): boolean =>
    first.length === second.length && first.every(item => second.some(other => sameElimination(item, other)));

const sameCells = (first: readonly CellReference[], second: readonly CellReference[]): boolean =>
    first.length === second.length && first.every(cell => second.some(other => sameCell(cell, other)));

const verifyBoard = (board: LessonBoard): { problems: string[]; answer: number[][] | null } => {
    if (!new RegExp(`^\\d{${BOARD_SIZE * BOARD_SIZE}}$`).test(board.values)) {
        return { problems: [`A board has ${board.values.length} cells`], answer: null };
    }
    const grid = boardGrid(board);
    const solver = new SudokuSolver();
    if (solver.countSolutions(grid, 2) !== 1) return { problems: ["A board does not have exactly one solution"], answer: null };
    const answer = solver.solve(grid);
    if (answer === null) return { problems: ["A board has no solution"], answer: null };

    const problems = (board.removedCandidates ?? [])
        .filter(({ cell, digit }) => answer[cell.row][cell.column] === digit)
        .map(({ cell, digit }) => `The board removes ${digit} from row ${cell.row}, column ${cell.column}, its answer`);
    return { problems, answer };
};

const verifyTechnique = (
    board: LessonBoard,
    technique: TechniqueId,
    removals: readonly Elimination[],
    pattern: readonly CellReference[] | undefined,
): string[] => {
    const found = TECHNIQUES[technique]().find(boardState(board));
    if (found === null) return [`${technique} finds nothing on this board`];

    const problems: string[] = [];
    if (found.technique !== technique) problems.push(`The technique found ${found.technique}, not ${technique}`);
    if (!sameEliminations(found.eliminations, removals)) problems.push(`${technique} removes other candidates on this board`);
    if (pattern !== undefined && !sameCells(found.focus, pattern)) problems.push(`${technique} uses another pattern on this board`);
    return problems;
};

/** What is wrong with a step's content: an impossible board, or a claim the solver does not make. */
export const verifyLessonStep = (step: LessonStep): string[] => {
    const { problems, answer } = verifyBoard(step.board);
    if (answer === null) return problems;

    if (step.kind === "place" && answer[step.answer.row][step.answer.column] !== step.digit) {
        problems.push(`Row ${step.answer.row}, column ${step.answer.column} is not ${step.digit}`);
    }
    if (step.kind === "remove" && step.technique !== undefined) {
        problems.push(...verifyTechnique(step.board, step.technique, step.removals, step.pattern));
    }
    if (step.kind === "show" && step.technique !== undefined) {
        problems.push(...verifyTechnique(step.board, step.technique, step.marks.eliminated ?? [], undefined));
    }
    (step.marks.answers ?? [])
        .filter(({ cell, digit }) => answer[cell.row][cell.column] !== digit)
        .forEach(({ cell, digit }) => problems.push(`Row ${cell.row}, column ${cell.column} is shown as ${digit}, not its answer`));
    return problems;
};
