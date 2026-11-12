/** A 9×9 board with every cell empty, fresh for each call. */
export const emptyBoard = (): number[][] => Array.from({ length: 9 }, () => Array<number>(9).fill(0));
