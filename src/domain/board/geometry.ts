import { BOX_SIZE } from "@/domain/board/constants";
import type { CellReference } from "@/domain/board/CellReference";

/** A row, a column or a box: the three kinds of house a digit appears once in. */
export type HouseKind = "row" | "column" | "box";

/** The first row or column of the box band that holds row or column `index`. */
export const boxStart = (index: number): number => Math.floor(index / BOX_SIZE) * BOX_SIZE;

/** The box of a cell, numbered from 0 in reading order from the top left. */
export const boxIndexOf = (row: number, column: number): number =>
    Math.floor(row / BOX_SIZE) * BOX_SIZE + Math.floor(column / BOX_SIZE);

/** The top-left cell of box `boxIndex`, numbered from 0 in reading order. */
export const boxOrigin = (boxIndex: number): CellReference =>
    ({ row: boxStart(boxIndex), column: (boxIndex % BOX_SIZE) * BOX_SIZE });
