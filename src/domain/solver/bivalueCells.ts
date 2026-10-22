import { BOARD_SIZE } from "@/domain/board/constants";
import type { BoardState } from "@/domain/solver/BoardState";
import type { CellReference } from "@/domain/solver/SolveStep";

/** An empty cell left with exactly two candidates. */
export interface BivalueCell {
    cell: CellReference;
    candidates: [number, number];
}

export const collectBivalueCells = (state: BoardState): BivalueCell[] => {
    const bivalueCells: BivalueCell[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const candidates = state.candidatesOf(row, column);
            if (candidates.length === 2) {
                bivalueCells.push({
                    cell: { row, column },
                    candidates: [candidates[0], candidates[1]],
                });
            }
        }
    }
    return bivalueCells;
};
