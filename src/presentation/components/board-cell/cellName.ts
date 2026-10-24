// A cell's chess-style name, row then column counted from 1: (3, 6) is "R4C7"
export const cellName = (row: number, column: number): string => `R${row + 1}C${column + 1}`;
