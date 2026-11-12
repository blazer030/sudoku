import { HOUSES } from "@/domain/solver/houses";

/** Whether a full grid holds each digit once in every row, column and box: the oracle the generator and solver tests check against. */
export const isValidSolution = (grid: number[][]): boolean =>
    HOUSES.every(({ cells }) => {
        const digits = cells.map(({ row, column }) => grid[row][column]);
        return new Set(digits).size === digits.length && digits.every(digit => digit >= 1 && digit <= digits.length);
    });
