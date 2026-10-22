import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import type { CellReference, ChainLink, Scope, SolveStep } from "@/domain/solver/SolveStep";

export type StepHighlight = "none" | "scope" | "pattern" | "answer" | "wrong";

export interface StepCellView {
    highlight: StepHighlight;
    /** The solver's candidates to show instead of the player's notes; null keeps the player's own content. */
    candidates: number[] | null;
    eliminated: number[];
    emphasized: number[];
}

/** A solver step together with the board's candidates just before it, indexed [row][column]. */
export interface PresentedStep {
    step: SolveStep;
    candidatesBefore: number[][][];
}

/** What the board a step is shown on looks like, cell by cell. */
export interface StepBoard {
    /** No given and no placed digit. */
    isEmpty: (row: number, column: number) => boolean;
    /** Whether an empty cell shows the solver's candidates; when it does not, it shows none. */
    showsCandidates: (row: number, column: number) => boolean;
}

export const cellKey = (cell: CellReference): string => `${cell.row}-${cell.column}`;

const sameCell = (left: CellReference, right: CellReference): boolean =>
    left.row === right.row && left.column === right.column;

export const scopeCells = (scope: Scope): CellReference[] => {
    const cells: CellReference[] = [];
    if (scope.kind === "row") {
        for (let column = 0; column < BOARD_SIZE; column++) cells.push({ row: scope.row, column });
    } else if (scope.kind === "column") {
        for (let row = 0; row < BOARD_SIZE; row++) cells.push({ row, column: scope.column });
    } else {
        for (let row = scope.boxRow; row < scope.boxRow + BOX_SIZE; row++) {
            for (let column = scope.boxColumn; column < scope.boxColumn + BOX_SIZE; column++) {
                cells.push({ row, column });
            }
        }
    }
    return cells;
};

// Wings carry no chain links of their own, so draw the relationships that make them work.
const wingLinks = ({ step, candidatesBefore }: PresentedStep): ChainLink[] => {
    const candidatesOf = (cell: CellReference): number[] => candidatesBefore[cell.row][cell.column];
    const eliminatedDigit = step.eliminations.length > 0 ? step.eliminations[0].digit : 0;

    if (step.technique === "xyWing" || step.technique === "xyzWing" || step.technique === "wxyzWing") {
        const [pivot, ...pincers] = step.focus;
        return pincers.map((pincer) => {
            const shared = candidatesOf(pincer).filter((digit) => candidatesOf(pivot).includes(digit));
            // Anchor the line on the digit the pivot hands to the pincer, not on the eliminated one.
            const digit = shared.find((candidate) => candidate !== eliminatedDigit) ?? (shared.length > 0 ? shared[0] : 0);
            return { from: pivot, to: pincer, digit, type: "strong" };
        });
    }

    if (step.technique === "wWing" && step.supporters) {
        // Endpoint – supporter – strong link – supporter – endpoint, all on the pair digit that is kept.
        const [endpointOne, endpointTwo] = step.focus;
        const [supporterOne, supporterTwo] = step.supporters;
        const linkDigit = candidatesOf(endpointOne).find((digit) => digit !== eliminatedDigit) ?? 0;
        return [
            { from: endpointOne, to: supporterOne, digit: linkDigit, type: "weak" },
            { from: supporterOne, to: supporterTwo, digit: linkDigit, type: "strong" },
            { from: supporterTwo, to: endpointTwo, digit: linkDigit, type: "weak" },
        ];
    }

    return [];
};

const patternDigits = (step: SolveStep, candidates: number[], eliminatedHere: number[]): number[] => {
    if (step.technique.startsWith("naked")) return candidates;
    if (step.technique.startsWith("hidden")) return candidates.filter((digit) => !eliminatedHere.includes(digit));
    const eliminationDigits = new Set(step.eliminations.map((elimination) => elimination.digit));
    return candidates.filter((digit) => eliminationDigits.has(digit));
};

/** Every cell any of the steps touches. */
export const touchedCellKeys = (steps: readonly PresentedStep[]): Set<string> => {
    const keys = new Set<string>();
    const add = (cell: CellReference) => keys.add(cellKey(cell));
    for (const { step } of steps) {
        step.focus.forEach(add);
        step.supporters?.forEach(add);
        step.eliminations.forEach((elimination) => add(elimination.cell));
        step.assignments.forEach((assignment) => add(assignment.cell));
        step.chainLinks?.forEach((link) => { add(link.from); add(link.to); });
        step.scopes.flatMap(scopeCells).forEach(add);
    }
    return keys;
};

/** The lines to draw for a step: its chain links, or for a wing the links that make it work. */
export const stepLinks = (presented: PresentedStep): ChainLink[] => {
    const { chainLinks } = presented.step;
    if (chainLinks && chainLinks.length > 0) return chainLinks;
    return wingLinks(presented);
};

const scopeKeysOf = (step: SolveStep): Set<string> => new Set(step.scopes.flatMap(scopeCells).map(cellKey));

const viewCell = (
    { step, candidatesBefore }: PresentedStep,
    cell: CellReference,
    board: StepBoard,
    scopeKeys: Set<string>,
    links: ChainLink[],
): StepCellView => {
    const view: StepCellView = { highlight: "none", candidates: null, eliminated: [], emphasized: [] };
    const { row, column } = cell;

    const isEmpty = board.isEmpty(row, column);
    const candidates = isEmpty && board.showsCandidates(row, column) ? candidatesBefore[row][column] : [];
    const eliminated = step.eliminations
        .filter((elimination) => sameCell(elimination.cell, cell))
        .map((elimination) => elimination.digit);
    if (isEmpty) {
        view.candidates = candidates;
        view.eliminated = eliminated;
    }

    const linkDigitsHere = (): number[] => links
        .filter((link) => sameCell(link.from, cell) || sameCell(link.to, cell))
        .map((link) => link.digit);

    const assignment = step.assignments.find((item) => sameCell(item.cell, cell));
    if (assignment) {
        view.highlight = "answer";
        view.emphasized = [assignment.digit];
    } else if (step.focus.some((focus) => sameCell(focus, cell))) {
        view.highlight = "pattern";
        if (step.assignments.length === 0) view.emphasized = patternDigits(step, candidates, eliminated);
    } else if (step.supporters?.some((supporter) => sameCell(supporter, cell))) {
        view.highlight = "pattern";
        view.emphasized = candidates.filter((digit) => linkDigitsHere().includes(digit));
    } else if (scopeKeys.has(cellKey(cell))) {
        view.highlight = "scope";
    }
    return view;
};

/** How one cell shows a step: its highlight, the candidates it lists, and the digits struck or stressed. */
export const stepCellView = (presented: PresentedStep, row: number, column: number, board: StepBoard): StepCellView =>
    viewCell(presented, { row, column }, board, scopeKeysOf(presented.step), stepLinks(presented));

/** The whole 9×9 grid for a step, working out its scopes and links once. */
export const stepCellViews = (presented: PresentedStep, board: StepBoard): StepCellView[][] => {
    const scopeKeys = scopeKeysOf(presented.step);
    const links = stepLinks(presented);
    return Array.from({ length: BOARD_SIZE }, (_, row) =>
        Array.from({ length: BOARD_SIZE }, (__, column) => viewCell(presented, { row, column }, board, scopeKeys, links)));
};
