import { BOARD_SIZE } from "@/domain/board/constants";
import { SudokuSolver } from "@/domain/generator/SudokuSolver";
import { boardGrid, boardState } from "@/domain/lessons/lessonBoard";
import type { Contradiction, LessonBoard, LessonStep } from "@/domain/lessons/Lesson";
import type { BoardState } from "@/domain/solver/BoardState";
import { inSameBox, sameCell } from "@/domain/solver/cellRelations";
import type { Assignment, CellReference, Elimination, TechniqueId } from "@/domain/solver/SolveStep";
import { TECHNIQUES } from "@/domain/solver/techniqueRegistry";

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

const ALL_CELLS: readonly CellReference[] = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
    row: Math.floor(index / BOARD_SIZE),
    column: index % BOARD_SIZE,
}));

/** The digit can go nowhere else in one of the cell's row, column or box, or the cell can hold nothing else. */
const isSingle = (state: BoardState, { cell, digit }: Assignment): boolean => {
    if (state.candidatesOf(cell.row, cell.column).length === 1) return true;
    const houses = [
        (other: CellReference) => other.row === cell.row,
        (other: CellReference) => other.column === cell.column,
        (other: CellReference) => inSameBox(other, cell),
    ];
    return houses.some(inHouse => ALL_CELLS
        .filter(other => inHouse(other) && !sameCell(other, cell))
        .every(other => !state.candidatesOf(other.row, other.column).includes(digit)));
};

const placeAt = ({ cell, digit }: Assignment): string => `${digit} at row ${cell.row}, column ${cell.column}`;

/** Checks each supposed digit in turn, and returns the board with all of them on it. */
const verifySupposed = (
    board: LessonBoard,
    answer: number[][],
    supposed: readonly Assignment[],
): { problems: string[]; state: BoardState } => {
    const problems: string[] = [];
    const state = supposed.reduce((current, assignment, index) => {
        const { cell, digit } = assignment;
        if (current.valueAt(cell.row, cell.column) !== 0) {
            problems.push(`The supposed ${placeAt(assignment)} is in a filled cell`);
            return current;
        }
        if (!current.candidatesOf(cell.row, cell.column).includes(digit)) {
            problems.push(`The supposed ${placeAt(assignment)} clashes with a digit before it`);
            return current;
        }
        if (index === 0 && answer[cell.row][cell.column] === digit) {
            problems.push(`The first supposed ${placeAt(assignment)} is the cell's answer`);
        }
        if (index > 0 && !isSingle(current, assignment)) {
            problems.push(`The supposed ${placeAt(assignment)} does not follow from the ones before it`);
        }
        return current.assign(cell.row, cell.column, digit);
    }, boardState(board));
    return { problems, state };
};

const verifyContradiction = (state: BoardState, { digit, range }: Contradiction): string[] => {
    if (range.some(cell => state.valueAt(cell.row, cell.column) === digit)) return [`The contradiction's range already holds ${digit}`];
    return range
        .filter(cell => state.candidatesOf(cell.row, cell.column).includes(digit))
        .map(cell => `Row ${cell.row}, column ${cell.column} can still hold ${digit}, so there is no contradiction`);
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
    const supposition = verifySupposed(step.board, answer, step.marks.supposed ?? []);
    problems.push(...supposition.problems);
    if (step.kind === "show" && step.contradiction !== undefined) {
        problems.push(...verifyContradiction(supposition.state, step.contradiction));
    }
    (step.marks.answers ?? [])
        .filter(({ cell, digit }) => answer[cell.row][cell.column] !== digit)
        .forEach(({ cell, digit }) => problems.push(`Row ${cell.row}, column ${cell.column} is shown as ${digit}, not its answer`));
    return problems;
};
