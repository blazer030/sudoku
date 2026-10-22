// Sparse boards that once kept the solution counter busy for seconds to minutes (stage 4 review).
const parseBoard = (digits: string): number[][] =>
    Array.from({ length: 9 }, (_, row) => Array.from({ length: 9 }, (_, column) => Number(digits.charAt(row * 9 + column))));

/** 17 givens and no solution; even with propagation the search needs millions of nodes to prove it. */
export const openNoSolutionPuzzle = parseBoard(
    "000005080000601043000000000010500000000106000300000005530000061000000004000000000",
);

/** No solution, which singles propagation finds before any branching. */
export const contradictorySparsePuzzle = parseBoard(
    "000100030000000780900000000003000000006000000000000950000000000000001000090000000",
);

/** At least two solutions. */
export const openTwoSolutionPuzzle = parseBoard(
    "000000000060000200000300590005060000000000000000000410000006000806007100000000080",
);
