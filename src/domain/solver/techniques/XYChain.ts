import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, ChainLink, Elimination, SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";

const MAX_CHAIN_CELLS = 12;

interface BivalueCell {
    cell: CellReference;
    candidates: [number, number];
}

export class XYChain implements Technique {
    public find(state: BoardState): SolveStep | null {
        const bivalueCells = collectBivalueCells(state);
        for (const start of bivalueCells) {
            const [v1, v2] = start.candidates;
            const tryAssumeV1 = dfs(state, bivalueCells, start, v2, v1, [start.cell], []);
            if (tryAssumeV1) return tryAssumeV1;
            const tryAssumeV2 = dfs(state, bivalueCells, start, v1, v2, [start.cell], []);
            if (tryAssumeV2) return tryAssumeV2;
        }
        return null;
    }
}

function dfs(
    state: BoardState,
    bivalueCells: BivalueCell[],
    head: BivalueCell,
    targetZ: number,
    propagateDigit: number,
    path: CellReference[],
    chainLinks: ChainLink[],
): SolveStep | null {
    if (path.length >= 4 && propagateDigit === targetZ) {
        const tail = path[path.length - 1];
        const eliminations = collectEndpointEliminations(state, head.cell, tail, targetZ, path);
        if (eliminations.length > 0) {
            return {
                technique: "xyChain",
                focus: [...path],
                assignments: [],
                eliminations,
                scopes: [],
                chainLinks: [...chainLinks],
            };
        }
    }
    if (path.length >= MAX_CHAIN_CELLS) return null;

    const tail = path[path.length - 1];
    for (const candidate of bivalueCells) {
        if (path.some((cell) => sameCell(cell, candidate.cell))) continue;
        if (!candidate.candidates.includes(propagateDigit)) continue;
        if (!arePeers(candidate.cell, tail)) continue;
        const candidateExit = candidate.candidates.find((digit) => digit !== propagateDigit);
        if (candidateExit === undefined) continue;
        const newChainLinks: ChainLink[] = [
            ...chainLinks,
            { from: tail, to: candidate.cell, digit: propagateDigit, type: "strong" },
        ];
        const newPath = [...path, candidate.cell];
        const step = dfs(state, bivalueCells, head, targetZ, candidateExit, newPath, newChainLinks);
        if (step) return step;
    }
    return null;
}

function collectBivalueCells(state: BoardState): BivalueCell[] {
    const cells: BivalueCell[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const candidates = state.candidatesOf(row, column);
            if (candidates.length === 2) {
                cells.push({
                    cell: { row, column },
                    candidates: [candidates[0], candidates[1]],
                });
            }
        }
    }
    return cells;
}

function sameCell(a: CellReference, b: CellReference): boolean {
    return a.row === b.row && a.column === b.column;
}

function arePeers(a: CellReference, b: CellReference): boolean {
    if (sameCell(a, b)) return false;
    if (a.row === b.row) return true;
    if (a.column === b.column) return true;
    return inSameBox(a, b);
}

function inSameBox(a: CellReference, b: CellReference): boolean {
    const boxRowA = Math.floor(a.row / BOX_SIZE);
    const boxColumnA = Math.floor(a.column / BOX_SIZE);
    const boxRowB = Math.floor(b.row / BOX_SIZE);
    const boxColumnB = Math.floor(b.column / BOX_SIZE);
    return boxRowA === boxRowB && boxColumnA === boxColumnB;
}

function collectEndpointEliminations(
    state: BoardState,
    head: CellReference,
    tail: CellReference,
    digit: number,
    chainCells: CellReference[],
): Elimination[] {
    const eliminations: Elimination[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const candidate: CellReference = { row, column };
            if (chainCells.some((cell) => sameCell(cell, candidate))) continue;
            if (!arePeers(candidate, head)) continue;
            if (!arePeers(candidate, tail)) continue;
            if (!state.candidatesOf(row, column).includes(digit)) continue;
            eliminations.push({ cell: candidate, digit });
        }
    }
    return eliminations;
}
