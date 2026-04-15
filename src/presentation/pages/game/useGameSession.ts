import { computed, reactive } from "vue";
import { useRouter } from "vue-router";
import { provideGameCompleteModal } from "./components/useGameCompleteModal";
import { BOARD_SIZE, Sudoku, StepRecorder } from "@/domain";
import { useGameStore } from "@/stores/gameStore";
import { ROUTER_PATH } from "@/router";
import { captureInitialBoard, type CellState } from "@/application/GameState";
import type { GameReplayData } from "@/application/Statistics";
import { useGameTimer } from "./useGameTimer";
import { useGameCompletion } from "./useGameCompletion";
import { useLeaveGame } from "./useLeaveGame";
import { useHintActions } from "./useHintActions";
import { useCompletionFlash } from "./useCompletionFlash";
import { useSettingsStore } from "@/stores/settingsStore";

export const useGameSession = () => {
    const router = useRouter();
    const gameStore = useGameStore();

    if (!gameStore.hasActiveGame) {
        void router.replace(ROUTER_PATH.home);
    }

    const sudoku = (() => {
        if (gameStore.sudoku) {
            const instance = reactive(new Sudoku());
            instance.restore(gameStore.sudoku.answer, gameStore.sudoku.puzzle);
            instance.hintTracker.restore(gameStore.sudoku.hintTracker.totalUsed);
            return instance;
        }
        return reactive(new Sudoku());
    })();

    const stepRecorder = new StepRecorder();
    const initialBoard: CellState[][] = captureInitialBoard(sudoku.raw());

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
        onCompleted: (origin) => {
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
                });
            });
        },
    });

    const settingsStore = useSettingsStore();
    const { triggerFlash, isFlashing } = useCompletionFlash(() => settingsStore.completionFlash);

    const { clearErrors, isError, openHintMenu } = useHintActions({
        sudoku: sudoku.raw(),
        stepRecorder,
        onRevealComplete: (origin) => { checkAndComplete(origin); },
        onGroupCompleted: triggerFlash,
    });

    const { leaveDialog, showLeaveDialog } = useLeaveGame({
        sudoku: sudoku.raw(),
        difficulty,
        completed,
        getElapsedSeconds: () => elapsedSeconds.value,
        getReplayData,
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
        openHintMenu,
        showLeaveDialog,
        triggerFlash,
        isFlashing,
    };
};
