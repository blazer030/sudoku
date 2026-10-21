import { computed, inject, reactive } from "vue";
import { provideGameCompleteModal } from "@/presentation/pages/game/components/useGameCompleteModal";
import { BOARD_SIZE, Sudoku, StepRecorder } from "@/domain";
import { useGameStore } from "@/stores/gameStore";
import { captureInitialBoard } from "@/application/GameState";
import type { GameReplayData } from "@/application/statistics/StatisticsRepository";
import { useGameTimer } from "@/presentation/pages/game/useGameTimer";
import { useGameCompletion } from "@/presentation/pages/game/useGameCompletion";
import { useLeaveGame } from "@/presentation/pages/game/useLeaveGame";
import { useHintActions } from "@/presentation/pages/game/useHintActions";
import { useGameToast } from "@/presentation/pages/game/useGameToast";
import { useCompletionFlash } from "@/presentation/pages/game/useCompletionFlash";
import { useSettingsStore } from "@/stores/settingsStore";
import { ANALYTICS_KEY } from "@/application/analytics/AnalyticsService";

export const useGameSession = () => {
    const gameStore = useGameStore();
    const analytics = inject(ANALYTICS_KEY);

    const sudoku = (() => {
        if (gameStore.sudoku) {
            const instance = reactive(new Sudoku());
            instance.restore(gameStore.sudoku.answer, gameStore.sudoku.puzzle);
            instance.hintTracker.restore(gameStore.sudoku.hintTracker.totalUsed);
            return instance;
        }
        return reactive(new Sudoku());
    })();

    const savedReplay = gameStore.replay;
    const stepRecorder = new StepRecorder();
    if (savedReplay) {
        stepRecorder.restore(savedReplay.steps);
    }
    const initialBoard = savedReplay?.initialBoard ?? captureInitialBoard(sudoku.raw());

    const getReplayData = (): GameReplayData => ({
        initialBoard,
        steps: stepRecorder.steps,
    });

    const gameCompleteModal = provideGameCompleteModal();

    const difficulty = computed(() => gameStore.difficulty ?? "easy");

    const { completed, checkAndComplete } = useGameCompletion({
        sudoku: sudoku.raw(),
        difficulty,
        getElapsedSeconds: () => elapsedSeconds.value,
        getReplayData,
        analytics,
        onCompleted: (origin, { isNewRecord }) => {
            const allCells: { row: number; column: number }[] = [];
            for (let row = 0; row < BOARD_SIZE; row++) {
                for (let column = 0; column < BOARD_SIZE; column++) {
                    allCells.push({ row, column });
                }
            }
            triggerFlash(allCells, origin, () => {
                void gameCompleteModal.open({
                    elapsedSeconds: elapsedSeconds.value,
                    difficulty: difficulty.value,
                    hintsUsed: sudoku.hintTracker.recordedUsed,
                    isNewRecord,
                });
            });
        },
    });

    const settingsStore = useSettingsStore();
    const { triggerFlash, isFlashing } = useCompletionFlash(() => settingsStore.completionFlash);

    const gameToast = useGameToast();

    const { clearErrors, isError, isRevealed, openHintMenu, hintMode } = useHintActions({
        sudoku: sudoku.raw(),
        stepRecorder,
        autoRemoveNotes: () => settingsStore.autoRemoveNotes,
        onRevealComplete: (origin) => { checkAndComplete(origin); },
        onGroupCompleted: triggerFlash,
        onHintReveal: outcome => { gameToast.show({ kind: "randomReveal", outcome }); },
        onNoConflicts: () => { gameToast.show({ kind: "noConflicts" }); },
        analytics,
    });

    const { leaveDialog, showLeaveDialog } = useLeaveGame({
        sudoku: sudoku.raw(),
        difficulty,
        completed,
        getElapsedSeconds: () => elapsedSeconds.value,
        getReplayData,
        analytics,
        // Hint mode is never saved: leaving ends it with the board untouched.
        onLeave: hintMode.cancel,
    });

    const timerPaused = computed(() => completed.value || leaveDialog.visible.value);
    const { elapsedSeconds } = useGameTimer({
        initialSeconds: gameStore.elapsedSeconds,
        paused: timerPaused,
    });

    return {
        gameStore,
        sudoku,
        stepRecorder,
        difficulty,
        elapsedSeconds,
        completed,
        checkAndComplete,
        clearErrors,
        isError,
        isRevealed,
        openHintMenu,
        hintMode,
        toastContent: gameToast.content,
        showToast: gameToast.show,
        showLeaveDialog,
        triggerFlash,
        isFlashing,
    };
};
