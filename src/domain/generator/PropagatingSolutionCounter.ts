import { BOARD_SIZE, TOTAL_CELLS } from "@/domain/board/constants";

// Each cell keeps its candidates as a 9-bit mask: bit (digit - 1) is set while the digit is still possible.
const ALL_DIGITS_MASK = (1 << BOARD_SIZE) - 1;
const BOX_SIZE = 3;

const buildUnits = (): number[][] => {
    const units: number[][] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        units.push(Array.from({ length: BOARD_SIZE }, (_, column) => row * BOARD_SIZE + column));
    }
    for (let column = 0; column < BOARD_SIZE; column++) {
        units.push(Array.from({ length: BOARD_SIZE }, (_, row) => row * BOARD_SIZE + column));
    }
    for (let box = 0; box < BOARD_SIZE; box++) {
        const startRow = Math.floor(box / BOX_SIZE) * BOX_SIZE;
        const startColumn = (box % BOX_SIZE) * BOX_SIZE;
        units.push(Array.from({ length: BOARD_SIZE }, (_, offset) =>
            (startRow + Math.floor(offset / BOX_SIZE)) * BOARD_SIZE + startColumn + (offset % BOX_SIZE)));
    }
    return units;
};

/** The 27 rows, columns and boxes, each as its 9 cell indexes. */
const UNITS = buildUnits();

/** For each cell, the indexes into `UNITS` of its row, column and box. */
const UNITS_OF_CELL: number[][] = Array.from({ length: TOTAL_CELLS }, (_, cell) =>
    UNITS.flatMap((unit, unitIndex) => (unit.includes(cell) ? [unitIndex] : [])));

/** For each cell, the 20 other cells that share its row, column or box. */
const PEERS_OF_CELL: number[][] = Array.from({ length: TOTAL_CELLS }, (_, cell) => {
    const peers = new Set(UNITS_OF_CELL[cell].flatMap((unitIndex) => UNITS[unitIndex]));
    peers.delete(cell);
    return [...peers];
});

const CANDIDATE_COUNT_OF_MASK: number[] = Array.from({ length: ALL_DIGITS_MASK + 1 }, (_, mask) => {
    let count = 0;
    for (let remaining = mask; remaining !== 0; remaining &= remaining - 1) count++;
    return count;
});

const lowestBit = (mask: number): number => mask & -mask;

/**
 * Removes `digitBit` from `cell` and follows what that forces: a cell left with one candidate takes it
 * (naked single), and a digit left with one place in a row, column or box goes there (hidden single).
 * Returns false when the board runs into a contradiction.
 */
const eliminate = (candidates: Uint16Array, cell: number, digitBit: number): boolean => {
    if ((candidates[cell] & digitBit) === 0) return true;
    candidates[cell] &= ~digitBit;
    const remaining = candidates[cell];
    if (remaining === 0) return false;
    if (CANDIDATE_COUNT_OF_MASK[remaining] === 1) {
        for (const peer of PEERS_OF_CELL[cell]) {
            if (!eliminate(candidates, peer, remaining)) return false;
        }
    }
    for (const unitIndex of UNITS_OF_CELL[cell]) {
        let placeCount = 0;
        let onlyPlace = -1;
        for (const unitCell of UNITS[unitIndex]) {
            if ((candidates[unitCell] & digitBit) === 0) continue;
            placeCount++;
            onlyPlace = unitCell;
            if (placeCount > 1) break;
        }
        if (placeCount === 0) return false;
        if (placeCount === 1 && !assign(candidates, onlyPlace, digitBit)) return false;
    }
    return true;
};

/** Places `digitBit` in `cell` by removing every other candidate there. Returns false on a contradiction. */
const assign = (candidates: Uint16Array, cell: number, digitBit: number): boolean => {
    let others = candidates[cell] & ~digitBit;
    while (others !== 0) {
        const otherBit = lowestBit(others);
        others &= ~otherBit;
        if (!eliminate(candidates, cell, otherBit)) return false;
    }
    return true;
};

/** The unsolved cell with the fewest candidates, or -1 when every cell is down to one. */
const cellWithFewestCandidates = (candidates: Uint16Array): number => {
    let bestCell = -1;
    let bestCount = BOARD_SIZE + 1;
    for (let cell = 0; cell < TOTAL_CELLS; cell++) {
        const count = CANDIDATE_COUNT_OF_MASK[candidates[cell]];
        if (count > 1 && count < bestCount) {
            bestCell = cell;
            bestCount = count;
            if (count === 2) break;
        }
    }
    return bestCell;
};

export interface PropagatingCount {
    /** Solutions found, stopping at the limit. */
    solutions: number;
    /** Whether the search stopped because it ran out of nodes rather than finishing. */
    exhausted: boolean;
}

/**
 * Counts the solutions of `board` (0 for empty, indexed [row][column]) up to `limit`, filling the
 * cells singles force before each guess so most boards settle in a handful of search nodes.
 * Visits at most `maxNodes` search nodes.
 */
export const countSolutionsWithPropagation = (board: number[][], limit: number, maxNodes: number): PropagatingCount => {
    const candidates = new Uint16Array(TOTAL_CELLS).fill(ALL_DIGITS_MASK);
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const digit = board[row][column];
            if (digit === 0) continue;
            if (!assign(candidates, row * BOARD_SIZE + column, 1 << (digit - 1))) {
                return { solutions: 0, exhausted: false };
            }
        }
    }

    const progress = { nodesLeft: maxNodes, solutions: 0, exhausted: false };
    const search = (state: Uint16Array): void => {
        if (progress.nodesLeft <= 0) {
            progress.exhausted = true;
            return;
        }
        progress.nodesLeft--;
        const cell = cellWithFewestCandidates(state);
        if (cell === -1) {
            progress.solutions++;
            return;
        }
        let untried = state[cell];
        while (untried !== 0) {
            const digitBit = lowestBit(untried);
            untried &= ~digitBit;
            const guess = state.slice();
            if (assign(guess, cell, digitBit)) search(guess);
            if (progress.exhausted || progress.solutions >= limit) return;
        }
    };
    search(candidates);
    return { solutions: progress.solutions, exhausted: progress.exhausted && progress.solutions < limit };
};
