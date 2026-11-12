import { BOARD_SIZE } from "@/domain/board/constants";
import type { BoardState } from "@/domain/solver/BoardState";
import { arePeers, sameCell } from "@/domain/solver/cellRelations";
import type { CellReference, Elimination } from "@/domain/solver/SolveStep";

/**
 * The digit taken out of every cell that sees all of `seers` and still holds it, in reading order:
 * the eliminations of a wing or a chain, whose ends each force the digit somewhere among them. The seers
 * are never among them, as a cell does not see itself; `excluded` leaves out the pattern's other cells.
 */
export const eliminationsSeenByAll = (
    state: BoardState,
    seers: readonly CellReference[],
    digit: number,
    excluded: readonly CellReference[] = [],
): Elimination[] => {
    const eliminations: Elimination[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const cell: CellReference = { row, column };
            if (excluded.some(other => sameCell(other, cell))) continue;
            if (!seers.every(seer => arePeers(cell, seer))) continue;
            if (!state.candidatesOf(row, column).includes(digit)) continue;
            eliminations.push({ cell, digit });
        }
    }
    return eliminations;
};
