import { computed, watch } from "vue";
import { GameReplay } from "@/domain/game/GameReplay";
import type { GameReplayData } from "@/application/statistics/StatisticsRepository";
import type { GameStep, GameStepAction } from "@/domain/game/GameStep";
import type { CellReference } from "@/domain/solver/SolveStep";
import { usePlaybackState } from "@/presentation/components/playback/usePlaybackState";
import type { PlayState } from "@/presentation/components/playback/useProgressDrag";

export interface ReviewDescription {
    keypath: string;
    params: { value?: number; row?: number; column?: number };
}

/** The board as the game began, one of the player's actions, or the board as the game ended. */
export type ReviewStage = "initial" | "action" | "final";

const stepParams = (step: GameStep): ReviewDescription["params"] => ({
    value: step.value,
    row: step.row + 1,
    column: step.column + 1,
});

const ACTION_DESCRIPTIONS: Record<GameStepAction, (step: GameStep) => ReviewDescription> = {
    fill: (step) => ({ keypath: "review.fill", params: stepParams(step) }),
    erase: (step) => ({ keypath: "review.erase", params: stepParams(step) }),
    toggleNote: (step) => ({ keypath: "review.toggleNote", params: stepParams(step) }),
    hint: (step) => ({ keypath: "review.hint", params: stepParams(step) }),
    autoNotes: () => ({ keypath: "review.autoNotes", params: {} }),
    undo: () => ({ keypath: "review.undo", params: {} }),
};

// Auto notes and undo are recorded at row 0, column 0, so only these actions name a real cell.
const CELL_ACTIONS: ReadonlySet<GameStepAction> = new Set(["fill", "erase", "toggleNote", "hint"]);

export const useGameReview = (replayData: GameReplayData, completed: boolean) => {
    const replay = new GameReplay(replayData.initialBoard, replayData.steps);
    // Positions run from the initial board, through every action, to the final board.
    const virtualTotalSteps = computed(() => replay.totalSteps + 1);
    const positionCount = computed(() => replay.totalSteps + 2);

    const playback = usePlaybackState(virtualTotalSteps);
    const playState: PlayState = {
        isPlaying: playback.isPlaying,
        stopPlay: playback.stopPlay,
        startPlay: playback.startPlay,
    };

    const isAtFinalStep = computed(() => playback.currentStep.value === virtualTotalSteps.value);

    const stage = computed((): ReviewStage => {
        if (playback.currentStep.value === 0) return "initial";
        if (isAtFinalStep.value) return "final";
        return "action";
    });

    watch(playback.currentStep, (step) => {
        if (step <= replay.totalSteps) {
            replay.goToStep(step);
        }
    }, { immediate: true });

    const board = computed(() => {
        if (isAtFinalStep.value) {
            replay.goToLast();
        }
        void playback.currentStep.value;
        return replay.board;
    });

    const gameStep = computed((): GameStep | null => {
        if (isAtFinalStep.value) return null;
        void playback.currentStep.value;
        return replay.currentGameStep;
    });

    const changedCell = computed((): CellReference | null => {
        const step = gameStep.value;
        if (step === null || !CELL_ACTIONS.has(step.action)) return null;
        return { row: step.row, column: step.column };
    });

    const description = computed((): ReviewDescription => {
        if (isAtFinalStep.value) {
            return { keypath: completed ? "review.completed" : "review.gaveUp", params: {} };
        }
        const step = gameStep.value;
        if (!step) return { keypath: "review.initialBoard", params: {} };
        return ACTION_DESCRIPTIONS[step.action](step);
    });

    return {
        currentStep: playback.currentStep,
        positionCount,
        stage,
        board,
        gameStep,
        changedCell,
        description,
        playState,
        next: playback.next,
        previous: playback.previous,
        goToStep: playback.goToStep,
        togglePlay: playback.togglePlay,
    };
};
