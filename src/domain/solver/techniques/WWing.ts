import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, Scope, SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";
import { arePeers, sameCell } from "@/domain/solver/cellRelations";
import { collectBivalueCells, type BivalueCell } from "@/domain/solver/bivalueCells";
import { eliminationsSeenByAll } from "@/domain/solver/eliminations";
import { HOUSES, cellsWithCandidate } from "@/domain/solver/houses";

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

            const eliminations = eliminationsSeenByAll(
                state,
                [endpointA.cell, endpointB.cell],
                eliminationDigit,
                [pair.supporterForA, pair.supporterForB],
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

function collectStrongLinks(state: BoardState, digit: number): StrongLink[] {
    const links: StrongLink[] = [];
    for (const house of HOUSES) {
        const cells = cellsWithCandidate(state, house, digit);
        if (cells.length === 2) links.push({ first: cells[0], second: cells[1], scope: house.scope });
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

function sameCandidates(left: [number, number], right: [number, number]): boolean {
    return (left[0] === right[0] && left[1] === right[1])
        || (left[0] === right[1] && left[1] === right[0]);
}
