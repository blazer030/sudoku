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
});
