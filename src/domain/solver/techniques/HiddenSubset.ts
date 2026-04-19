import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, Elimination, SolveStep, TechniqueId } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";

const TECHNIQUE_BY_SIZE: Record<number, TechniqueId> = {
    2: "hiddenPair",
    3: "hiddenTriple",
    4: "hiddenQuad",
};

interface ScopeCell {
    cell: CellReference;
    candidates: number[];
}

export class HiddenSubset implements Technique {
    public constructor(private readonly size: number) {}

    public find(state: BoardState): SolveStep | null {
        for (let row = 0; row < BOARD_SIZE; row++) {
            const step = this.findInScope(collectRowCells(state, row));
            if (step) return step;
        }
        for (let column = 0; column < BOARD_SIZE; column++) {
            const step = this.findInScope(collectColumnCells(state, column));
            if (step) return step;
        }
        for (let boxRow = 0; boxRow < BOARD_SIZE; boxRow += BOX_SIZE) {
            for (let boxColumn = 0; boxColumn < BOARD_SIZE; boxColumn += BOX_SIZE) {
                const step = this.findInScope(collectBoxCells(state, boxRow, boxColumn));
                if (step) return step;
            }
        }
        return null;
    }

    private findInScope(emptyCells: ScopeCell[]): SolveStep | null {
        const digitCombinations = combinationsOfSize(digitsOneToNine(), this.size);
        for (const digits of digitCombinations) {
            const matchingCells = emptyCells.filter((entry) =>
                digits.some((digit) => entry.candidates.includes(digit)),
            );
            if (matchingCells.length !== this.size) continue;

            const eliminations = collectOtherCandidates(matchingCells, digits);
            if (eliminations.length === 0) continue;

            return {
                technique: TECHNIQUE_BY_SIZE[this.size],
                focus: matchingCells.map((entry) => entry.cell),
                assignments: [],
                eliminations,
            };
        }
        return null;
    }
}

function digitsOneToNine(): number[] {
    const digits: number[] = [];
    for (let digit = 1; digit <= BOARD_SIZE; digit++) digits.push(digit);
    return digits;
}

function combinationsOfSize<T>(items: T[], size: number): T[][] {
    const results: T[][] = [];
    const recurse = (startIndex: number, current: T[]): void => {
        if (current.length === size) {
            results.push([...current]);
            return;
        }
        for (let index = startIndex; index < items.length; index++) {
            current.push(items[index]);
            recurse(index + 1, current);
            current.pop();
        }
    };
    recurse(0, []);
    return results;
}

function collectOtherCandidates(cells: ScopeCell[], subsetDigits: number[]): Elimination[] {
    const eliminations: Elimination[] = [];
    for (const entry of cells) {
        for (const digit of entry.candidates) {
            if (!subsetDigits.includes(digit)) {
                eliminations.push({ cell: entry.cell, digit });
            }
        }
    }
    return eliminations;
}

function collectRowCells(state: BoardState, row: number): ScopeCell[] {
    const cells: ScopeCell[] = [];
    for (let column = 0; column < BOARD_SIZE; column++) {
        const candidates = state.candidatesOf(row, column);
        if (candidates.length > 0) {
            cells.push({ cell: { row, column }, candidates });
        }
    }
    return cells;
}

function collectColumnCells(state: BoardState, column: number): ScopeCell[] {
    const cells: ScopeCell[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        const candidates = state.candidatesOf(row, column);
        if (candidates.length > 0) {
            cells.push({ cell: { row, column }, candidates });
        }
    }
    return cells;
}

function collectBoxCells(state: BoardState, boxStartRow: number, boxStartColumn: number): ScopeCell[] {
    const cells: ScopeCell[] = [];
    for (let row = boxStartRow; row < boxStartRow + BOX_SIZE; row++) {
        for (let column = boxStartColumn; column < boxStartColumn + BOX_SIZE; column++) {
            const candidates = state.candidatesOf(row, column);
            if (candidates.length > 0) {
                cells.push({ cell: { row, column }, candidates });
            }
        }
    }
    return cells;
}
