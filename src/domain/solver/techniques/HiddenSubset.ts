import { BOARD_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { Elimination, Scope, SolveStep, TechniqueId } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";
import { HOUSES, combinationsOf, emptyCellsOf, type HouseCell } from "@/domain/solver/houses";

const TECHNIQUE_BY_SIZE: Record<number, TechniqueId> = {
    2: "hiddenPair",
    3: "hiddenTriple",
    4: "hiddenQuad",
};

export class HiddenSubset implements Technique {
    public constructor(private readonly size: number) {}

    public find(state: BoardState): SolveStep | null {
        for (const house of HOUSES) {
            const step = this.findInScope(emptyCellsOf(state, house), house.scope);
            if (step) return step;
        }
        return null;
    }

    private findInScope(emptyCells: HouseCell[], scope: Scope): SolveStep | null {
        const digitCombinations = combinationsOf(digitsOneToNine(), this.size);
        for (const digits of digitCombinations) {
            const matchingCells = emptyCells.filter((entry) =>
                digits.some((digit) => entry.candidates.includes(digit)),
            );
            if (matchingCells.length !== this.size) continue;

            const allDigitsPresent = digits.every((digit) =>
                matchingCells.some((entry) => entry.candidates.includes(digit)),
            );
            if (!allDigitsPresent) continue;

            const eliminations = collectOtherCandidates(matchingCells, digits);
            if (eliminations.length === 0) continue;

            return {
                technique: TECHNIQUE_BY_SIZE[this.size],
                focus: matchingCells.map((entry) => entry.cell),
                assignments: [],
                eliminations,
                scopes: [scope],
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

function collectOtherCandidates(cells: HouseCell[], subsetDigits: number[]): Elimination[] {
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
