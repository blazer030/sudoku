import { computed, inject, reactive } from "vue";
import { provideGameCompleteModal, type GameCompleteAction } from "@/presentation/pages/game/components/useGameCompleteModal";
import { BOARD_SIZE } from "@/domain/board/constants";
import { Sudoku, type CompletedCells, type CompletedGroup } from "@/domain/game/Sudoku";
import { StepRecorder } from "@/domain/game/StepRecorder";
import { useRouter } from "vue-router";
import { useGameStore } from "@/stores/gameStore";
import { useStatisticsStore } from "@/stores/statisticsStore";
import { ROUTER_PATH } from "@/router";
import { captureInitialBoard } from "@/application/game/GameState";
import type { GameReplayData } from "@/application/statistics/StatisticsRepository";
import { useGameTimer } from "@/presentation/pages/game/useGameTimer";
import { useGameCompletion } from "@/presentation/pages/game/useGameCompletion";
import { useLeaveGame } from "@/presentation/pages/game/useLeaveGame";
import { useHintActions } from "@/presentation/pages/game/useHintActions";
import { useGameToast } from "@/presentation/pages/game/useGameToast";
import { useMotionAllowed } from "@/presentation/composables/useMotionAllowed";
import { useGroupEffect } from "@/presentation/pages/game/useGroupEffect";
import { useStyleMoments } from "@/presentation/components/style-moments/styleMoments";
import { useSettingsStore } from "@/stores/settingsStore";
import { ANALYTICS_KEY } from "@/application/analytics/AnalyticsService";

interface GameSessionOptions {
    /** The player chose Play Again on the completion modal. */
    onPlayAgain: () => void;
}

export const useGameSession = ({ onPlayAgain }: GameSessionOptions) => {
    const router = useRouter();
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
    const statisticsStore = useStatisticsStore();

    const handleCompleteAction = (action: GameCompleteAction) => {
        switch (action) {
        case "home":
            router.back();
            break;
        case "review":
            // Replace, so Back from the review does not land on the finished game
            void router.replace(ROUTER_PATH.gameReviewFor(statisticsStore.history.length - 1));
            break;
        case "playAgain":
            onPlayAgain();
            break;
        }
    };

    const difficulty = computed(() => gameStore.difficulty ?? "easy");

    const { completed, checkAndComplete } = useGameCompletion({
        sudoku: sudoku.raw(),
        difficulty,
        getElapsedSeconds: () => elapsedSeconds.value,
        getReplayData,
        analytics,
        onCompleted: (origin, { isNewRecord }) => {
            // The whole board ripples, as every row completed at once
            const allRows: CompletedGroup[] = [];
            const allCells: { row: number; column: number }[] = [];
            for (let row = 0; row < BOARD_SIZE; row++) {
                allRows.push({ kind: "row", index: row });
                for (let column = 0; column < BOARD_SIZE; column++) {
                    allCells.push({ row, column });
                }
            }
            groupEffect.play(allRows, allCells, origin, () => {
                void gameCompleteModal.open({
                    elapsedSeconds: elapsedSeconds.value,
                    difficulty: difficulty.value,
                    hintsUsed: sudoku.hintTracker.recordedUsed,
                    isNewRecord,
                }).then(handleCompleteAction);
            });
        },
    });

    const settingsStore = useSettingsStore();
    const styleMoments = useStyleMoments();
    const groupEffect = useGroupEffect(useMotionAllowed(), () => styleMoments.value.groupEffectMs);
    const playGroupEffect = (completed: CompletedCells, origin: { row: number; column: number }) => {
        groupEffect.play(completed.groups, completed.cells, origin);
    };

    const gameToast = useGameToast();

    const { clearErrors, isError, isRevealed, openHintMenu, hintMode, dismissOverlay } = useHintActions({
        sudoku: sudoku.raw(),
        stepRecorder,
        autoRemoveNotes: () => settingsStore.autoRemoveNotes,
        onRevealComplete: (origin) => { checkAndComplete(origin); },
        onGroupCompleted: playGroupEffect,
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
        dismissOverlay,
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
        playGroupEffect,
        groupEffect: groupEffect.effect,
        isInGroupEffect: groupEffect.isInEffect,
    };
};
