import { BoardState } from "@/domain/solver/BoardState";
import { ChainGraph } from "@/domain/solver/chains/ChainGraph";

const emptyBoard = (): number[][] =>
    Array.from({ length: 9 }, () => Array<number>(9).fill(0));

describe("ChainGraph", () => {
    it("should find a strong link when a digit has exactly two candidates in a row", () => {
        let state = BoardState.fromPuzzle(emptyBoard());
        for (const column of [2, 3, 4, 5, 6, 7, 8]) {
            state = state.eliminate(0, column, 1);
        }

        const graph = new ChainGraph(state);

        expect(graph.strongLinks(1)).toContainEqual({
            from: { row: 0, column: 0 },
            to: { row: 0, column: 1 },
            digit: 1,
            type: "strong",
        });
    });

    it("should find a strong link when a digit has exactly two candidates in a column", () => {
        let state = BoardState.fromPuzzle(emptyBoard());
        for (const row of [2, 3, 4, 5, 6, 7, 8]) {
            state = state.eliminate(row, 0, 2);
        }

        const graph = new ChainGraph(state);

        expect(graph.strongLinks(2)).toContainEqual({
            from: { row: 0, column: 0 },
            to: { row: 1, column: 0 },
            digit: 2,
            type: "strong",
        });
    });

    it("should find a strong link when a digit has exactly two candidates in a box", () => {
        let state = BoardState.fromPuzzle(emptyBoard());
        for (const row of [3, 4, 5, 6, 7, 8]) {
            for (let column = 0; column < 9; column++) {
                state = state.eliminate(row, column, 3);
            }
        }
        for (const cell of [
            [0, 0], [0, 2],
            [1, 0], [1, 1], [1, 2],
            [2, 0], [2, 1],
        ] as const) {
            state = state.eliminate(cell[0], cell[1], 3);
        }

        const graph = new ChainGraph(state);

        expect(graph.strongLinks(3)).toContainEqual({
            from: { row: 0, column: 1 },
            to: { row: 2, column: 2 },
            digit: 3,
            type: "strong",
        });
    });

    it("should return an empty list when no strong link exists for the digit", () => {
        const state = BoardState.fromPuzzle(emptyBoard());

        const graph = new ChainGraph(state);

        expect(graph.strongLinks(1)).toEqual([]);
    });
});
