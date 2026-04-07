import { computed, reactive } from "vue";
import { useRouter } from "vue-router";
import { provideGameCompleteModal } from "@/presentation/themes/classic/components/useGameCompleteModal";
import { Sudoku } from "@/domain";
import { useGameStore } from "@/stores/gameStore";
import { ROUTER_PATH } from "@/router";
import { useGameTimer } from "@/presentation/pages/game/useGameTimer";
import { useGameCompletion } from "@/presentation/pages/game/useGameCompletion";
import { useLeaveGame } from "./useLeaveGame";
import { useHintActions } from "./useHintActions";
import { useCompletionFlash } from "./useCompletionFlash";

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

    const gameCompleteModal = provideGameCompleteModal();

    const difficulty = computed(() => gameStore.difficulty ?? "easy");

    const { completed, checkAndComplete } = useGameCompletion({
        sudoku: sudoku.raw(),
        difficulty,
        getElapsedSeconds: () => elapsedSeconds.value,
        onCompleted: () => {
            void gameCompleteModal.open({
                elapsedSeconds: elapsedSeconds.value,
                difficulty: difficulty.value,
                hintsUsed: sudoku.hintTracker.recordedUsed,
            });
        },
    });

    const { triggerFlash, isFlashing } = useCompletionFlash();

    const { clearErrors, isError, openHintMenu } = useHintActions({
        sudoku: sudoku.raw(),
        onRevealComplete: checkAndComplete,
        onGroupCompleted: triggerFlash,
    });

    const { leaveDialog, showLeaveDialog } = useLeaveGame({
        sudoku: sudoku.raw(),
        difficulty,
        completed,
        getElapsedSeconds: () => elapsedSeconds.value,
    });

    const timerPaused = computed(() => completed.value || leaveDialog.visible.value);
    const { elapsedSeconds } = useGameTimer({
        initialSeconds: gameStore.elapsedSeconds,
        paused: timerPaused,
    });

    return {
        gameStore,
        sudoku,
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
