import { BoardState } from "@/domain/solver/BoardState";
import { ChainLink } from "@/domain/solver/SolveStep";
import { HOUSES, cellsWithCandidate } from "@/domain/solver/houses";

export class ChainGraph {
    public constructor(private readonly state: BoardState) {}

    public strongLinks(digit: number): ChainLink[] {
        const links: ChainLink[] = [];
        for (const house of HOUSES) {
            const cells = cellsWithCandidate(this.state, house, digit);
            if (cells.length === 2) {
                links.push({
                    from: cells[0],
                    to: cells[1],
                    digit,
                    type: "strong",
                });
            }
        }
        return links;
    }
}
