import { computed, inject, onScopeDispose, reactive, ref } from "vue";
import { provideGameCompleteModal, type GameCompleteAction } from "@/presentation/pages/game/components/useGameCompleteModal";
import { Sudoku, type CompletedCells } from "@/domain/game/Sudoku";
import { StepRecorder } from "@/domain/game/StepRecorder";
import { useRouter } from "vue-router";
import { useGameStore } from "@/stores/gameStore";
import { useStatisticsStore } from "@/stores/statisticsStore";
import { ROUTER_PATH } from "@/router";
import { captureInitialBoard } from "@/application/game/GameState";
import type { GameReplayData } from "@/application/statistics/StatisticsRepository";
import { useGameTimer } from "@/presentation/pages/game/useGameTimer";
import { useGameCompletion, type CompletionOutcome } from "@/presentation/pages/game/useGameCompletion";
import { useLeaveGame } from "@/presentation/pages/game/useLeaveGame";
import { useHintActions } from "@/presentation/pages/game/useHintActions";
import { useGameToast } from "@/presentation/pages/game/useGameToast";
import { useMotionAllowed } from "@/presentation/composables/useMotionAllowed";
import { useGroupEffect } from "@/presentation/pages/game/useGroupEffect";
import { useStyleMoments, type CelebrationPhase } from "@/presentation/components/style-moments/styleMoments";
import { useSettingsStore } from "@/stores/settingsStore";
import { ANALYTICS_KEY } from "@/application/analytics/AnalyticsService";

interface GameSessionOptions {
    /** The player chose Play Again on the completion modal. */
    onPlayAgain: () => void;
}

export const useGameSession = ({ onPlayAgain }: GameSessionOptions) => {
    const router = useRouter();
    const gameStore = useGameStore();
    const statisticsStore = useStatisticsStore();
    const settingsStore = useSettingsStore();
    const analytics = inject(ANALYTICS_KEY);
    const motionAllowed = useMotionAllowed();
    const styleMoments = useStyleMoments();
    const gameCompleteModal = provideGameCompleteModal();
    const gameToast = useGameToast();

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

    const celebration = ref<CelebrationPhase | null>(null);
    let celebrationTimer: ReturnType<typeof setTimeout> | null = null;

    const difficulty = computed(() => gameStore.difficulty ?? "easy");

    const getReplayData = (): GameReplayData => ({
        initialBoard,
        steps: stepRecorder.steps,
    });

    const groupEffect = useGroupEffect(motionAllowed, () => styleMoments.value.groupEffectMs);
    const playGroupEffect = (completed: CompletedCells, origin: { row: number; column: number }) => {
        groupEffect.play(completed.groups, completed.cells, origin);
    };

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

    // The solving entry plays the style's celebration alone: its board phase, then the dialog
    const celebrate = ({ isNewRecord }: CompletionOutcome) => {
        const openDialog = (still: boolean) => {
            void gameCompleteModal.open({
                elapsedSeconds: elapsedSeconds.value,
                difficulty: difficulty.value,
                hintsUsed: sudoku.hintTracker.recordedUsed,
                isNewRecord,
                still,
            }).then(handleCompleteAction);
        };
        // A group effect still running from the entry before ends here
        groupEffect.stop();
        if (!motionAllowed()) {
            celebration.value = "still";
            openDialog(true);
            return;
        }
        celebration.value = "playing";
        celebrationTimer = setTimeout(() => {
            celebrationTimer = null;
            celebration.value = "done";
            openDialog(false);
        }, styleMoments.value.celebrationBoardMs);
    };

    // The timer comes last, as it pauses on completion and on the leave dialog; the callbacks before it
    // read its time only once the game runs
    const { completed, checkAndComplete } = useGameCompletion({
        sudoku: sudoku.raw(),
        difficulty,
        getElapsedSeconds: () => elapsedSeconds.value,
        getReplayData,
        analytics,
        onCompleted: celebrate,
    });

    const { clearErrors, isError, isRevealed, openHintMenu, hintMode, dismissOverlay } = useHintActions({
        sudoku: sudoku.raw(),
        stepRecorder,
        autoRemoveNotes: () => settingsStore.autoRemoveNotes,
        onRevealComplete: checkAndComplete,
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

    // Leaving mid-celebration leaves no timer to open the dialog later
    onScopeDispose(() => {
        if (celebrationTimer !== null) clearTimeout(celebrationTimer);
        celebrationTimer = null;
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
        celebration,
        groupEffect: groupEffect.effect,
        isInGroupEffect: groupEffect.isInEffect,
    };
};
