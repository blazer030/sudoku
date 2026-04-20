import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, ChainLink } from "@/domain/solver/SolveStep";

export class ChainGraph {
    public constructor(private readonly state: BoardState) {}

    public strongLinks(digit: number): ChainLink[] {
        const links: ChainLink[] = [];
        for (const unit of allUnits()) {
            const cellsWithCandidate: CellReference[] = [];
            for (const cell of unit) {
                if (this.state.candidatesOf(cell.row, cell.column).includes(digit)) {
                    cellsWithCandidate.push(cell);
                }
            }
            if (cellsWithCandidate.length === 2) {
                links.push({
                    from: cellsWithCandidate[0],
                    to: cellsWithCandidate[1],
                    digit,
                    type: "strong",
                });
            }
        }
        return links;
    }
}

function allUnits(): CellReference[][] {
    const units: CellReference[][] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        const cells: CellReference[] = [];
        for (let column = 0; column < BOARD_SIZE; column++) {
            cells.push({ row, column });
        }
        units.push(cells);
    }
    for (let column = 0; column < BOARD_SIZE; column++) {
        const cells: CellReference[] = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            cells.push({ row, column });
        }
        units.push(cells);
    }
    for (let boxRow = 0; boxRow < BOARD_SIZE; boxRow += BOX_SIZE) {
        for (let boxColumn = 0; boxColumn < BOARD_SIZE; boxColumn += BOX_SIZE) {
            const cells: CellReference[] = [];
            for (let row = boxRow; row < boxRow + BOX_SIZE; row++) {
                for (let column = boxColumn; column < boxColumn + BOX_SIZE; column++) {
                    cells.push({ row, column });
                }
            }
            units.push(cells);
        }
    }
    return units;
}
