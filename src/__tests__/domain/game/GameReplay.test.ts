import { describe, expect, it } from "vitest";
import { GameReplay } from "@/domain/game/GameReplay";
import type { CellSnapshot, GameStep } from "@/domain/game/GameStep";

const createInitialBoard = (): { clue: number; entry: number; notes: number[] }[][] =>
    Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => ({ clue: 0, entry: 0, notes: [] }))
    );

const createSnapshot = (): CellSnapshot[][] =>
    Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => ({ entry: 0, notes: [] }))
    );

describe("GameReplay", () => {
    it("should start at step 0 with initial board", () => {
        const initialBoard = createInitialBoard();
        initialBoard[0][0].clue = 5;
        initialBoard[1][1].entry = 3;

        const replay = new GameReplay(initialBoard, []);

        expect(replay.currentStep).toBe(0);
        expect(replay.totalSteps).toBe(0);
        expect(replay.board[0][0].clue).toBe(5);
        expect(replay.board[0][0].isClue).toBe(true);
        expect(replay.board[1][1].entry).toBe(3);
    });

    it("should advance to next step showing updated board", () => {
        const initialBoard = createInitialBoard();
        const stepBoard = createSnapshot();
        stepBoard[2][4].entry = 6;
        const steps: GameStep[] = [
            { board: stepBoard, action: "fill", row: 2, column: 4, value: 6 },
        ];

        const replay = new GameReplay(initialBoard, steps);
        replay.next();

        expect(replay.currentStep).toBe(1);
        expect(replay.board[2][4].entry).toBe(6);
    });

    it("should go back to previous step", () => {
        const initialBoard = createInitialBoard();
        const stepBoard = createSnapshot();
        stepBoard[0][0].entry = 1;
        const steps: GameStep[] = [
            { board: stepBoard, action: "fill", row: 0, column: 0, value: 1 },
        ];

        const replay = new GameReplay(initialBoard, steps);
        replay.next();
        replay.previous();

        expect(replay.currentStep).toBe(0);
        expect(replay.board[0][0].entry).toBe(0);
    });

    it("should jump to first and last step", () => {
        const initialBoard = createInitialBoard();
        const step1 = createSnapshot();
        step1[0][0].entry = 1;
        const step2 = createSnapshot();
        step2[0][0].entry = 1;
        step2[1][1].entry = 2;
        const steps: GameStep[] = [
            { board: step1, action: "fill", row: 0, column: 0, value: 1 },
            { board: step2, action: "fill", row: 1, column: 1, value: 2 },
        ];

        const replay = new GameReplay(initialBoard, steps);
        replay.goToLast();
        expect(replay.currentStep).toBe(2);
        expect(replay.board[1][1].entry).toBe(2);

        replay.goToFirst();
        expect(replay.currentStep).toBe(0);
        expect(replay.board[1][1].entry).toBe(0);
    });

    it("should clamp within bounds", () => {
        const initialBoard = createInitialBoard();
        const replay = new GameReplay(initialBoard, []);

        replay.previous();
        expect(replay.currentStep).toBe(0);

        replay.next();
        expect(replay.currentStep).toBe(0);
    });

    it("should expose currentGameStep at each step", () => {
        const initialBoard = createInitialBoard();
        const stepBoard = createSnapshot();
        stepBoard[3][3].entry = 7;
        const steps: GameStep[] = [
            { board: stepBoard, action: "fill", row: 3, column: 3, value: 7 },
        ];

        const replay = new GameReplay(initialBoard, steps);
        expect(replay.currentGameStep).toBeNull();

        replay.next();
        expect(replay.currentGameStep).toEqual(steps[0]);
    });

    it("should include clue cells from initialBoard in step boards", () => {
        const initialBoard = createInitialBoard();
        initialBoard[4][4].clue = 9;
        const stepBoard = createSnapshot();
        stepBoard[0][0].entry = 1;
        const steps: GameStep[] = [
            { board: stepBoard, action: "fill", row: 0, column: 0, value: 1 },
        ];

        const replay = new GameReplay(initialBoard, steps);
        replay.next();

        expect(replay.board[4][4].clue).toBe(9);
        expect(replay.board[4][4].isClue).toBe(true);
        expect(replay.board[0][0].entry).toBe(1);
    });
});
