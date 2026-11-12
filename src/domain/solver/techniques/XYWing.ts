import { BoardState } from "@/domain/solver/BoardState";
import { SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";
import { arePeers, sameCell } from "@/domain/solver/cellRelations";
import { collectBivalueCells, type BivalueCell } from "@/domain/solver/bivalueCells";
import { eliminationsSeenByAll } from "@/domain/solver/eliminations";

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

                    const eliminations = // The pivot holds no z, and need not see the cells the pincers do
                    eliminationsSeenByAll(state, [pincerOne.cell, pincerTwo.cell], digitZ, [pivot.cell]);
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
