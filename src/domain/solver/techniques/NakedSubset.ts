import { BOARD_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, Elimination, SolveStep, TechniqueId } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";

const TECHNIQUE_BY_SIZE: Record<number, TechniqueId> = {
    2: "nakedPair",
    3: "nakedTriple",
    4: "nakedQuad",
};

export class NakedSubset implements Technique {
    public constructor(private readonly size: number) {}

    public find(state: BoardState): SolveStep | null {
        for (let row = 0; row < BOARD_SIZE; row++) {
            const step = this.findInRow(state, row);
            if (step) return step;
        }
        return null;
    }

    private findInRow(state: BoardState, row: number): SolveStep | null {
        const emptyCells: { cell: CellReference; candidates: number[] }[] = [];
        for (let column = 0; column < BOARD_SIZE; column++) {
            const candidates = state.candidatesOf(row, column);
            if (candidates.length > 0) {
                emptyCells.push({ cell: { row, column }, candidates });
            }
        }

        const combinations = combinationsOfSize(emptyCells, this.size);
        for (const combination of combinations) {
            const combinedDigits = unionOfCandidates(combination.map((entry) => entry.candidates));
            if (combinedDigits.length !== this.size) continue;

            const focusCells = combination.map((entry) => entry.cell);
            const eliminations = collectEliminations(emptyCells, focusCells, combinedDigits);
            if (eliminations.length === 0) continue;

            return {
                technique: TECHNIQUE_BY_SIZE[this.size],
                focus: focusCells,
                assignments: [],
                eliminations,
            };
        }
        return null;
    }
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

function unionOfCandidates(candidateLists: number[][]): number[] {
    const digits = new Set<number>();
    for (const list of candidateLists) {
        for (const digit of list) digits.add(digit);
    }
    return [...digits].sort((left, right) => left - right);
}

function collectEliminations(
    emptyCells: { cell: CellReference; candidates: number[] }[],
    focusCells: CellReference[],
    digits: number[],
): Elimination[] {
    const eliminations: Elimination[] = [];
    for (const entry of emptyCells) {
        if (focusCells.some((focus) => focus.row === entry.cell.row && focus.column === entry.cell.column)) continue;
        for (const digit of digits) {
            if (entry.candidates.includes(digit)) {
                eliminations.push({ cell: entry.cell, digit });
            }
        }
    }
    return eliminations;
}
