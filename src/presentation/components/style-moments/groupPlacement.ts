import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import type { CompletedGroup } from "@/domain/game/Sudoku";
import { boxOrigin } from "@/domain/board/geometry";

// Where the group overlays draw a completed group over the board

/** A length of `cells` cells, as a percentage of the board's side. */
export const boardPercent = (cells: number): string => `${(cells / BOARD_SIZE) * 100}%`;

/** Where the group lies on the board, in board percentages. */
export const groupPlacement = (group: CompletedGroup): Record<string, string> => {
    if (group.kind === "row") return { left: "0%", top: boardPercent(group.index), width: "100%", height: boardPercent(1) };
    if (group.kind === "column") return { left: boardPercent(group.index), top: "0%", width: boardPercent(1), height: "100%" };
    const corner = boxOrigin(group.index);
    return { left: boardPercent(corner.column), top: boardPercent(corner.row), width: boardPercent(BOX_SIZE), height: boardPercent(BOX_SIZE) };
};
