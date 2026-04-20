import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, Elimination, SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";

interface BivalueCell {
    cell: CellReference;
    candidates: [number, number];
}

interface QuadvalueCell {
    cell: CellReference;
    candidates: [number, number, number, number];
}

export class WXYZWing implements Technique {
    public find(state: BoardState): SolveStep | null {
        const quadvalueCells = collectQuadvalueCells(state);
        const bivalueCells = collectBivalueCells(state);

        for (const pivot of quadvalueCells) {
            const visiblePincers = bivalueCells.filter(
                (cell) =>
                    arePeers(cell.cell, pivot.cell) &&
                    cell.candidates.every((digit) => pivot.candidates.includes(digit)),
            );

            for (let firstIndex = 0; firstIndex < visiblePincers.length; firstIndex++) {
                for (let secondIndex = firstIndex + 1; secondIndex < visiblePincers.length; secondIndex++) {
                    for (let thirdIndex = secondIndex + 1; thirdIndex < visiblePincers.length; thirdIndex++) {
                        const pincerOne = visiblePincers[firstIndex];
                        const pincerTwo = visiblePincers[secondIndex];
                        const pincerThree = visiblePincers[thirdIndex];

                        const digitZ = sharedZDigit(
                            pivot.candidates,
                            pincerOne.candidates,
                            pincerTwo.candidates,
                            pincerThree.candidates,
                        );
                        if (digitZ === null) continue;

                        const eliminations = collectEliminations(
                            state,
                            pivot.cell,
                            pincerOne.cell,
                            pincerTwo.cell,
                            pincerThree.cell,
                            digitZ,
                        );
                        if (eliminations.length === 0) continue;

                        return {
                            technique: "wxyzWing",
                            focus: [pivot.cell, pincerOne.cell, pincerTwo.cell, pincerThree.cell],
                            assignments: [],
                            eliminations,
                            scopes: [],
                        };
                    }
                }
            }
        }

        return null;
    }
}

function collectQuadvalueCells(state: BoardState): QuadvalueCell[] {
    const cells: QuadvalueCell[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const candidates = state.candidatesOf(row, column);
            if (candidates.length === 4) {
                cells.push({
                    cell: { row, column },
                    candidates: [candidates[0], candidates[1], candidates[2], candidates[3]],
                });
            }
        }
    }
    return cells;
}

function collectBivalueCells(state: BoardState): BivalueCell[] {
    const cells: BivalueCell[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const candidates = state.candidatesOf(row, column);
            if (candidates.length === 2) {
                cells.push({
                    cell: { row, column },
                    candidates: [candidates[0], candidates[1]],
                });
            }
        }
    }
    return cells;
}

function sharedZDigit(
    pivotCandidates: [number, number, number, number],
    pincerOneCandidates: [number, number],
    pincerTwoCandidates: [number, number],
    pincerThreeCandidates: [number, number],
): number | null {
    for (const candidate of pincerOneCandidates) {
        if (!pincerTwoCandidates.includes(candidate)) continue;
        if (!pincerThreeCandidates.includes(candidate)) continue;
        if (!pivotCandidates.includes(candidate)) continue;
        const pincerOneOther = pincerOneCandidates.find((digit) => digit !== candidate);
        const pincerTwoOther = pincerTwoCandidates.find((digit) => digit !== candidate);
        const pincerThreeOther = pincerThreeCandidates.find((digit) => digit !== candidate);
        if (pincerOneOther === undefined) continue;
        if (pincerTwoOther === undefined) continue;
        if (pincerThreeOther === undefined) continue;
        if (pincerOneOther === pincerTwoOther) continue;
        if (pincerOneOther === pincerThreeOther) continue;
        if (pincerTwoOther === pincerThreeOther) continue;
        if (!pivotCandidates.includes(pincerOneOther)) continue;
        if (!pivotCandidates.includes(pincerTwoOther)) continue;
        if (!pivotCandidates.includes(pincerThreeOther)) continue;
        return candidate;
    }
    return null;
}

function collectEliminations(
    state: BoardState,
    pivot: CellReference,
    pincerOne: CellReference,
    pincerTwo: CellReference,
    pincerThree: CellReference,
    digit: number,
): Elimination[] {
    const eliminations: Elimination[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const candidate: CellReference = { row, column };
            if (sameCell(candidate, pivot)) continue;
            if (sameCell(candidate, pincerOne)) continue;
            if (sameCell(candidate, pincerTwo)) continue;
            if (sameCell(candidate, pincerThree)) continue;
            if (!arePeers(candidate, pivot)) continue;
            if (!arePeers(candidate, pincerOne)) continue;
            if (!arePeers(candidate, pincerTwo)) continue;
            if (!arePeers(candidate, pincerThree)) continue;
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
