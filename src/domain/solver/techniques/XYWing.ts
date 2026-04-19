import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, Elimination, SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";

interface BivalueCell {
    cell: CellReference;
    candidates: [number, number];
}

export class XYWing implements Technique {
    public find(state: BoardState): SolveStep | null {
        const bivalueCells = collectBivalueCells(state);

        for (const pivot of bivalueCells) {
            const [digitX, digitY] = pivot.candidates;
            const visiblePincers = bivalueCells.filter((cell) =>
                !sameCell(cell.cell, pivot.cell) && arePeers(cell.cell, pivot.cell),
            );

            for (const pincerOne of visiblePincers) {
                const digitZ = pincerSecondDigit(pincerOne, digitX, digitY);
                if (digitZ === null) continue;

                for (const pincerTwo of visiblePincers) {
                    if (sameCell(pincerOne.cell, pincerTwo.cell)) continue;
                    if (!matchesOtherPincer(pincerTwo, digitY, digitX, digitZ)) continue;

                    const eliminations = collectEliminations(
                        state,
                        pivot.cell,
                        pincerOne.cell,
                        pincerTwo.cell,
                        digitZ,
                    );
                    if (eliminations.length === 0) continue;

                    return {
                        technique: "xyWing",
                        focus: [pivot.cell, pincerOne.cell, pincerTwo.cell],
                        assignments: [],
                        eliminations,
                        scopes: [],
                    };
                }
            }
        }

        return null;
    }
}

function collectBivalueCells(state: BoardState): BivalueCell[] {
    const bivalues: BivalueCell[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const candidates = state.candidatesOf(row, column);
            if (candidates.length === 2) {
                bivalues.push({
                    cell: { row, column },
                    candidates: [candidates[0], candidates[1]],
                });
            }
        }
    }
    return bivalues;
}

function pincerSecondDigit(pincer: BivalueCell, digitX: number, digitY: number): number | null {
    const [first, second] = pincer.candidates;
    if (first === digitX && second !== digitY) return second;
    if (second === digitX && first !== digitY) return first;
    return null;
}

function matchesOtherPincer(
    pincer: BivalueCell,
    digitY: number,
    digitX: number,
    digitZ: number,
): boolean {
    const [first, second] = pincer.candidates;
    if (first === digitY && second === digitZ) return true;
    if (second === digitY && first === digitZ) return true;
    if (first === digitX || second === digitX) return false;
    return false;
}

function collectEliminations(
    state: BoardState,
    pivot: CellReference,
    pincerOne: CellReference,
    pincerTwo: CellReference,
    digit: number,
): Elimination[] {
    const eliminations: Elimination[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const candidate: CellReference = { row, column };
            if (sameCell(candidate, pivot)) continue;
            if (sameCell(candidate, pincerOne)) continue;
            if (sameCell(candidate, pincerTwo)) continue;
            if (!arePeers(candidate, pincerOne)) continue;
            if (!arePeers(candidate, pincerTwo)) continue;
            if (!state.candidatesOf(row, column).includes(digit)) continue;
            eliminations.push({ cell: candidate, digit });
        }
    }
    return eliminations;
}

function sameCell(a: CellReference, b: CellReference): boolean {
    return a.row === b.row && a.column === b.column;
}

function arePeers(a: CellReference, b: CellReference): boolean {
    if (sameCell(a, b)) return false;
    if (a.row === b.row) return true;
    if (a.column === b.column) return true;
    return inSameBox(a, b);
}

function inSameBox(a: CellReference, b: CellReference): boolean {
    const boxRowA = Math.floor(a.row / BOX_SIZE);
    const boxColumnA = Math.floor(a.column / BOX_SIZE);
    const boxRowB = Math.floor(b.row / BOX_SIZE);
    const boxColumnB = Math.floor(b.column / BOX_SIZE);
    return boxRowA === boxRowB && boxColumnA === boxColumnB;
}
