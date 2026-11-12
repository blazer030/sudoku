import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, Elimination, Scope, SolveStep, TechniqueId } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";
import { HOUSES, combinationsOf, emptyCellsOf, type HouseCell } from "@/domain/solver/houses";

const TECHNIQUE_BY_SIZE: Record<number, TechniqueId> = {
    2: "nakedPair",
    3: "nakedTriple",
    4: "nakedQuad",
};

export class NakedSubset implements Technique {
    public constructor(private readonly size: number) {}

    public find(state: BoardState): SolveStep | null {
        for (const house of HOUSES) {
            const step = this.findInScope(emptyCellsOf(state, house), house.scope);
            if (step) return step;
        }
        return null;
    }

    private findInScope(emptyCells: HouseCell[], scope: Scope): SolveStep | null {
        const combinations = combinationsOf(emptyCells, this.size);
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
                scopes: [scope],
            };
        }
        return null;
    }
}

function unionOfCandidates(candidateLists: number[][]): number[] {
    const digits = new Set<number>();
    for (const list of candidateLists) {
        for (const digit of list) digits.add(digit);
    }
    return [...digits].sort((left, right) => left - right);
}

function collectEliminations(
    emptyCells: HouseCell[],
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
