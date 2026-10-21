import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { Sudoku } from "@/domain/game/Sudoku";
import { PuzzleCell } from "@/domain/board/PuzzleCell";
import { useGameCompletion } from "@/presentation/pages/game/useGameCompletion";
import type { AnalyticsService } from "@/application/analytics/AnalyticsService";
import type { GameReplayData } from "@/application/statistics/StatisticsRepository";

const SOLVED_BOARD: number[][] = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

const buildCompleteSudoku = (): Sudoku => {
    const puzzleCells = SOLVED_BOARD.map((row) => row.map((value) => new PuzzleCell(value)));
    return Sudoku.restoreSave(SOLVED_BOARD, puzzleCells);
};

const buildIncompleteSudoku = (): Sudoku => {
    const puzzleCells = SOLVED_BOARD.map((row, rowIndex) =>
        row.map((value, columnIndex) => new PuzzleCell(rowIndex === 0 && columnIndex === 0 ? 0 : value))
    );
    return Sudoku.restoreSave(SOLVED_BOARD, puzzleCells);
};

const emptyReplay = (): GameReplayData => ({
    initialBoard: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ({ clue: 0, entry: 0, notes: [] }))),
    steps: [],
});

describe("useGameCompletion", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
    });

    it("emits game_complete analytics event when sudoku is completed", () => {
        const logEvent = vi.fn().mockResolvedValue(undefined);
        const analytics: AnalyticsService = { logEvent };
        const sudoku = buildCompleteSudoku();

        const { checkAndComplete } = useGameCompletion({
            sudoku,
            difficulty: ref("easy"),
            getElapsedSeconds: () => 420,
            getReplayData: emptyReplay,
            onCompleted: () => { /* noop */ },
            analytics,
        });

        checkAndComplete({ row: 0, column: 0 });

        expect(logEvent).toHaveBeenCalledWith({
            name: "game_complete",
            difficulty: "easy",
            time_seconds: 420,
            hints_used: 0,
        });
    });

    it("does not emit event when sudoku is not completed", () => {
        const logEvent = vi.fn().mockResolvedValue(undefined);
        const analytics: AnalyticsService = { logEvent };

        const { checkAndComplete } = useGameCompletion({
            sudoku: buildIncompleteSudoku(),
            difficulty: ref("easy"),
            getElapsedSeconds: () => 420,
            getReplayData: emptyReplay,
            onCompleted: () => { /* noop */ },
            analytics,
        });

        checkAndComplete({ row: 0, column: 0 });

        expect(logEvent).not.toHaveBeenCalled();
    });
});
