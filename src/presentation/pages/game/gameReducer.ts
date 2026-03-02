import PuzzleCell from "@/domain/PuzzleCell";

export interface GameState {
    puzzle: PuzzleCell[][];
    answer: number[][];
    selectedCell: { row: number; column: number } | null;
    isNoteMode: boolean;
    isCompleted: boolean;
}

type GameAction = { type: "INIT_GAME"; puzzle: PuzzleCell[][]; answer: number[][] };

export function initGame(puzzle: PuzzleCell[][], answer: number[][]): GameAction {
    return { type: "INIT_GAME", puzzle, answer };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case "INIT_GAME":
            return {
                ...state,
                puzzle: action.puzzle,
                answer: action.answer,
                selectedCell: null,
                isNoteMode: false,
                isCompleted: false,
            };
    }
}
