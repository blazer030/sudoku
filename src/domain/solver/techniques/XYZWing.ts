import { BOARD_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";
import { arePeers, sameCell } from "@/domain/solver/cellRelations";
import { collectBivalueCells } from "@/domain/solver/bivalueCells";
import { eliminationsSeenByAll } from "@/domain/solver/eliminations";

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

                    const eliminations = eliminationsSeenByAll(state, [pivot.cell, pincerOne.cell, pincerTwo.cell], digitZ);
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
