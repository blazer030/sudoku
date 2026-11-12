import { boxHouse, columnHouse, rowHouse } from "@/domain/solver/houses";
import type { LessonBoard } from "@/domain/lessons/Lesson";
import type { CellReference, ChainLink, Elimination } from "@/domain/solver/SolveStep";

// Rows, columns and boxes count from 1 here, as the lessons' copy does.

export const at = (row: number, column: number): CellReference => ({ row: row - 1, column: column - 1 });

export const cells = (...positions: readonly (readonly [number, number])[]): CellReference[] =>
    positions.map(([row, column]) => at(row, column));

export const rowOf = (row: number): CellReference[] => rowHouse(row - 1).cells.map(cell => ({ ...cell }));

export const columnOf = (column: number): CellReference[] => columnHouse(column - 1).cells.map(cell => ({ ...cell }));

export const boxOf = (box: number): CellReference[] => boxHouse(box - 1).cells.map(cell => ({ ...cell }));

export const removal = (row: number, column: number, digit: number): Elimination => ({ cell: at(row, column), digit });

export const link = (
    from: readonly [number, number],
    to: readonly [number, number],
    digit: number,
    type: ChainLink["type"] = "strong",
): ChainLink => ({ from: at(from[0], from[1]), to: at(to[0], to[1]), digit, type });

/** A lesson's message key: `lessons.content.<lesson>.<name>`. */
export const key = (lesson: string, name: string): string => `lessons.content.${lesson}.${name}`;

/** A board shown with its candidates, less any already ruled out. */
export const candidateBoard = (values: string, ...removedCandidates: readonly Elimination[]): LessonBoard => ({
    values,
    showsCandidates: true,
    ...(removedCandidates.length > 0 ? { removedCandidates } : {}),
});
