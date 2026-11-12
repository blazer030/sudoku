import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, ChainLink, SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";
import { arePeers, sameCell } from "@/domain/solver/cellRelations";
import { collectBivalueCells, type BivalueCell } from "@/domain/solver/bivalueCells";
import { eliminationsSeenByAll } from "@/domain/solver/eliminations";

const MAX_CHAIN_CELLS = 12;

export class XYChain implements Technique {
    public find(state: BoardState): SolveStep | null {
        const bivalueCells = collectBivalueCells(state);
        for (const start of bivalueCells) {
            const [firstDigit, secondDigit] = start.candidates;
            const assumingFirst = searchChain(state, bivalueCells, start, secondDigit, firstDigit, [start.cell], []);
            if (assumingFirst) return assumingFirst;
            const assumingSecond = searchChain(state, bivalueCells, start, firstDigit, secondDigit, [start.cell], []);
            if (assumingSecond) return assumingSecond;
        }
        return null;
    }
}

function searchChain(
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
        const eliminations = eliminationsSeenByAll(state, [head.cell, tail], targetZ, path);
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
        const step = searchChain(state, bivalueCells, head, targetZ, candidateExit, newPath, newChainLinks);
        if (step) return step;
    }
    return null;
}
