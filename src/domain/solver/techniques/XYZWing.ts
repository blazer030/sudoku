import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, Elimination, SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";

interface BivalueCell {
    cell: CellReference;
    candidates: [number, number];
}

interface TrivalueCell {
    cell: CellReference;
    candidates: [number, number, number];
}

export class XYZWing implements Technique {
    public find(state: BoardState): SolveStep | null {
        const trivalueCells = collectTrivalueCells(state);
        const bivalueCells = collectBivalueCells(state);

        for (const pivot of trivalueCells) {
            const visiblePincers = bivalueCells.filter((cell) => arePeers(cell.cell, pivot.cell));

            for (const pincerOne of visiblePincers) {
                for (const pincerTwo of visiblePincers) {
                    if (sameCell(pincerOne.cell, pincerTwo.cell)) continue;

                    const digitZ = sharedZDigit(pivot.candidates, pincerOne.candidates, pincerTwo.candidates);
                    if (digitZ === null) continue;

                    const eliminations = collectEliminations(
                        state,
                        pivot.cell,
                        pincerOne.cell,
                        pincerTwo.cell,
                        digitZ,
                    );
                    if (eliminations.length === 0) continue;

                    return {
                        technique: "xyzWing",
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

function collectTrivalueCells(state: BoardState): TrivalueCell[] {
    const trivalues: TrivalueCell[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const candidates = state.candidatesOf(row, column);
            if (candidates.length === 3) {
                trivalues.push({
                    cell: { row, column },
                    candidates: [candidates[0], candidates[1], candidates[2]],
                });
            }
        }
    }
    return trivalues;
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

function sharedZDigit(
    pivotCandidates: [number, number, number],
    pincerOneCandidates: [number, number],
    pincerTwoCandidates: [number, number],
): number | null {
    for (const digit of pincerOneCandidates) {
        if (!pincerTwoCandidates.includes(digit)) continue;
        if (!pivotCandidates.includes(digit)) continue;
        const pincerOneOther = pincerOneCandidates.find((candidate) => candidate !== digit);
        const pincerTwoOther = pincerTwoCandidates.find((candidate) => candidate !== digit);
        if (pincerOneOther === undefined || pincerTwoOther === undefined) continue;
        if (pincerOneOther === pincerTwoOther) continue;
        if (!pivotCandidates.includes(pincerOneOther)) continue;
        if (!pivotCandidates.includes(pincerTwoOther)) continue;
        return digit;
    }
    return null;
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
            if (!arePeers(candidate, pivot)) continue;
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
