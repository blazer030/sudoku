import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, Elimination, Scope, SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";

interface BivalueCell {
    cell: CellReference;
    candidates: [number, number];
}

interface StrongLink {
    first: CellReference;
    second: CellReference;
    scope: Scope;
}

export class WWing implements Technique {
    public find(state: BoardState): SolveStep | null {
        const bivalueCells = collectBivalueCells(state);

        for (let firstIndex = 0; firstIndex < bivalueCells.length; firstIndex++) {
            for (let secondIndex = firstIndex + 1; secondIndex < bivalueCells.length; secondIndex++) {
                const endpointA = bivalueCells[firstIndex];
                const endpointB = bivalueCells[secondIndex];
                if (!sameCandidates(endpointA.candidates, endpointB.candidates)) continue;
                if (arePeers(endpointA.cell, endpointB.cell)) continue;

                const [digitOne, digitTwo] = endpointA.candidates;
                const step =
                    this.tryLink(state, endpointA, endpointB, digitOne, digitTwo)
                    ?? this.tryLink(state, endpointA, endpointB, digitTwo, digitOne);
                if (step) return step;
            }
        }

        return null;
    }

    private tryLink(
        state: BoardState,
        endpointA: BivalueCell,
        endpointB: BivalueCell,
        linkDigit: number,
        eliminationDigit: number,
    ): SolveStep | null {
        for (const link of collectStrongLinks(state, linkDigit)) {
            const pair = matchLinkToEndpoints(link, endpointA.cell, endpointB.cell);
            if (!pair) continue;

            const eliminations = collectEliminations(
                state,
                endpointA.cell,
                endpointB.cell,
                [pair.supporterForA, pair.supporterForB],
                eliminationDigit,
            );
            if (eliminations.length === 0) continue;

            return {
                technique: "wWing",
                focus: [endpointA.cell, endpointB.cell],
                supporters: [pair.supporterForA, pair.supporterForB],
                assignments: [],
                eliminations,
                scopes: [link.scope],
            };
        }
        return null;
    }
}

function collectBivalueCells(state: BoardState): BivalueCell[] {
    const bivalues: BivalueCell[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const candidates = state.candidatesOf(row, column);
            if (candidates.length === 2) {
                bivalues.push({
                    cell: { row, column },
                    candidates: [candidates[0], candidates[1]],
                });
            }
        }
    }
    return bivalues;
}

function collectStrongLinks(state: BoardState, digit: number): StrongLink[] {
    const links: StrongLink[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        const cells = cellsWithCandidateInRow(state, row, digit);
        if (cells.length === 2) {
            links.push({ first: cells[0], second: cells[1], scope: { kind: "row", row } });
        }
    }
    for (let column = 0; column < BOARD_SIZE; column++) {
        const cells = cellsWithCandidateInColumn(state, column, digit);
        if (cells.length === 2) {
            links.push({ first: cells[0], second: cells[1], scope: { kind: "column", column } });
        }
    }
    for (let boxRow = 0; boxRow < BOARD_SIZE; boxRow += BOX_SIZE) {
        for (let boxColumn = 0; boxColumn < BOARD_SIZE; boxColumn += BOX_SIZE) {
            const cells = cellsWithCandidateInBox(state, boxRow, boxColumn, digit);
            if (cells.length === 2) {
                links.push({ first: cells[0], second: cells[1], scope: { kind: "box", boxRow, boxColumn } });
            }
        }
    }
    return links;
}

function matchLinkToEndpoints(
    link: StrongLink,
    endpointA: CellReference,
    endpointB: CellReference,
): { supporterForA: CellReference; supporterForB: CellReference } | null {
    const { first, second } = link;
    if (sameCell(first, endpointA) || sameCell(first, endpointB)) return null;
    if (sameCell(second, endpointA) || sameCell(second, endpointB)) return null;

    if (arePeers(first, endpointA) && arePeers(second, endpointB)) {
        return { supporterForA: first, supporterForB: second };
    }
    if (arePeers(second, endpointA) && arePeers(first, endpointB)) {
        return { supporterForA: second, supporterForB: first };
    }
    return null;
}

function collectEliminations(
    state: BoardState,
    endpointA: CellReference,
    endpointB: CellReference,
    supporters: [CellReference, CellReference],
    digit: number,
): Elimination[] {
    const eliminations: Elimination[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const candidate: CellReference = { row, column };
            if (sameCell(candidate, endpointA) || sameCell(candidate, endpointB)) continue;
            if (sameCell(candidate, supporters[0]) || sameCell(candidate, supporters[1])) continue;
            if (!arePeers(candidate, endpointA) || !arePeers(candidate, endpointB)) continue;
            if (!state.candidatesOf(row, column).includes(digit)) continue;
            eliminations.push({ cell: candidate, digit });
        }
    }
    return eliminations;
}

function cellsWithCandidateInRow(state: BoardState, row: number, digit: number): CellReference[] {
    const cells: CellReference[] = [];
    for (let column = 0; column < BOARD_SIZE; column++) {
        if (state.candidatesOf(row, column).includes(digit)) {
            cells.push({ row, column });
        }
    }
    return cells;
}

function cellsWithCandidateInColumn(state: BoardState, column: number, digit: number): CellReference[] {
    const cells: CellReference[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        if (state.candidatesOf(row, column).includes(digit)) {
            cells.push({ row, column });
        }
    }
    return cells;
}

function cellsWithCandidateInBox(
    state: BoardState,
    boxStartRow: number,
    boxStartColumn: number,
    digit: number,
): CellReference[] {
    const cells: CellReference[] = [];
    for (let row = boxStartRow; row < boxStartRow + BOX_SIZE; row++) {
        for (let column = boxStartColumn; column < boxStartColumn + BOX_SIZE; column++) {
            if (state.candidatesOf(row, column).includes(digit)) {
                cells.push({ row, column });
            }
        }
    }
    return cells;
}

function sameCandidates(left: [number, number], right: [number, number]): boolean {
    return (left[0] === right[0] && left[1] === right[1])
        || (left[0] === right[1] && left[1] === right[0]);
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
