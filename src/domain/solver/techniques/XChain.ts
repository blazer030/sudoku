import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, ChainLink, Elimination, SolveStep } from "@/domain/solver/SolveStep";
import { ChainGraph } from "@/domain/solver/chains/ChainGraph";
import { Technique } from "@/domain/solver/techniques/Technique";

const MAX_CHAIN_LINKS = 11;

export class XChain implements Technique {
    public find(state: BoardState): SolveStep | null {
        const graph = new ChainGraph(state);
        for (let digit = 1; digit <= BOARD_SIZE; digit++) {
            const strongLinks = graph.strongLinks(digit);
            if (strongLinks.length === 0) continue;

            const strongPartners = buildStrongPartnerMap(strongLinks);

            for (const startLink of strongLinks) {
                const orientations: [CellReference, CellReference][] = [
                    [startLink.from, startLink.to],
                    [startLink.to, startLink.from],
                ];
                for (const [head, second] of orientations) {
                    const step = extendChain(
                        state,
                        strongPartners,
                        digit,
                        head,
                        [head, second],
                        [{ from: head, to: second, digit, type: "strong" }],
                    );
                    if (step) return step;
                }
            }
        }
        return null;
    }
}

function extendChain(
    state: BoardState,
    strongPartners: Map<string, CellReference[]>,
    digit: number,
    head: CellReference,
    path: CellReference[],
    chainLinks: ChainLink[],
): SolveStep | null {
    if (path.length >= 4 && path.length % 2 === 0) {
        const tail = path[path.length - 1];
        const eliminations = collectEndpointEliminations(state, head, tail, digit, path);
        if (eliminations.length > 0) {
            return {
                technique: "xChain",
                focus: [...path],
                assignments: [],
                eliminations,
                scopes: [],
                chainLinks: [...chainLinks],
            };
        }
    }
    if (chainLinks.length >= MAX_CHAIN_LINKS) return null;

    const tail = path[path.length - 1];
    for (const weakPeer of collectWeakPeers(state, tail, digit, path)) {
        const partners = strongPartners.get(cellKey(weakPeer)) ?? [];
        for (const strongPartner of partners) {
            if (path.some((cell) => sameCell(cell, strongPartner))) continue;
            const newPath = [...path, weakPeer, strongPartner];
            const newChainLinks: ChainLink[] = [
                ...chainLinks,
                { from: tail, to: weakPeer, digit, type: "weak" },
                { from: weakPeer, to: strongPartner, digit, type: "strong" },
            ];
            const step = extendChain(state, strongPartners, digit, head, newPath, newChainLinks);
            if (step) return step;
        }
    }
    return null;
}

function buildStrongPartnerMap(strongLinks: ChainLink[]): Map<string, CellReference[]> {
    const map = new Map<string, CellReference[]>();
    for (const link of strongLinks) {
        addPartner(map, link.from, link.to);
        addPartner(map, link.to, link.from);
    }
    return map;
}

function addPartner(map: Map<string, CellReference[]>, cell: CellReference, partner: CellReference): void {
    const key = cellKey(cell);
    const existing = map.get(key) ?? [];
    if (!existing.some((other) => sameCell(other, partner))) existing.push(partner);
    map.set(key, existing);
}

function cellKey(cell: CellReference): string {
    return `${cell.row}-${cell.column}`;
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

function collectWeakPeers(
    state: BoardState,
    cell: CellReference,
    digit: number,
    excludePath: CellReference[],
): CellReference[] {
    const peers: CellReference[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const candidate: CellReference = { row, column };
            if (!arePeers(candidate, cell)) continue;
            if (!state.candidatesOf(row, column).includes(digit)) continue;
            if (excludePath.some((other) => sameCell(other, candidate))) continue;
            peers.push(candidate);
        }
    }
    return peers;
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
