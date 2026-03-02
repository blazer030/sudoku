import { describe, expect, it } from "vitest";
import { gameReducer, GameState, initGame } from "@/presentation/pages/game/gameReducer";
import PuzzleCell from "@/domain/PuzzleCell";

const mockPuzzle: PuzzleCell[][] = Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, column) => new PuzzleCell(row === 0 && column < 3 ? column + 1 : 0))
);

const mockAnswer: number[][] = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => 1)
);

describe("gameReducer", () => {
    it("should initialize puzzle, answer, and selectedCell as null on INIT_GAME", () => {
        const initialState: GameState = {
            puzzle: [],
            answer: [],
            selectedCell: null,
            isNoteMode: false,
            isCompleted: false,
        };

        const state = gameReducer(initialState, initGame(mockPuzzle, mockAnswer));

        expect(state.puzzle).toBe(mockPuzzle);
        expect(state.answer).toBe(mockAnswer);
        expect(state.selectedCell).toBeNull();
    });

    it("should set isNoteMode to false and isCompleted to false on INIT_GAME", () => {
        const initialState: GameState = {
            puzzle: [],
            answer: [],
            selectedCell: { row: 1, column: 1 },
            isNoteMode: true,
            isCompleted: true,
        };

        const state = gameReducer(initialState, initGame(mockPuzzle, mockAnswer));

        expect(state.isNoteMode).toBe(false);
        expect(state.isCompleted).toBe(false);
    });
});
