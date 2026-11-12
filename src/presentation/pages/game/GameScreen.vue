<template>
    <div
        class="flex flex-col gap-(--game-page-gap) min-h-full pt-(--game-page-top) pb-(--game-page-bottom) px-5 touch-manipulation"
        data-testid="game-screen"
        @click="handleScreenTap"
    >
        <GameHeader
            :elapsed-seconds="elapsedSeconds"
            :hint-mode="hintMode.active.value"
            @back="showLeaveDialog"
        />

        <div class="flex-1" />

        <div class="flex flex-col items-center gap-(--game-section-gap)">
            <BoardFrame
                :celebration="celebration"
                :effect="groupEffect"
                :target="frameTarget"
            >
                <SudokuBoard
                    :cells="sudoku.puzzle"
                    :class="[
                        hintMode.active.value ? 'ring-2 ring-primary/50' : 'ring-0 ring-transparent',
                        // On a small board the pad runs past the board, over the controls
                        { 'relative z-20': floatingPadCell !== null },
                    ]"
                    class="transition-shadow duration-300"
                    :data-board-canvas="boardCanvasTakes"
                    :data-celebration="celebration ?? undefined"
                    :data-group-effect="groupEffect?.id"
                    :data-hint-mode="hintMode.active.value || undefined"
                    :has-step-links="hintMode.active.value && hintMode.links.value.length > 0"
                    :selected-cell="selectedCell"
                    :style="groupEffectPlacement"
                    data-testid="game-board"
                >
                    <template #before-grid>
                        <BoardCanvas
                            v-model:takes="boardCanvasTakes"
                            :celebration="celebration"
                            :effect="groupEffect"
                        />
                    </template>
                    <template #cell="{ cell: puzzleCell, row: rowIndex, column: columnIndex }">
                        <Cell
                            :column="columnIndex"
                            :data-testid="`cell-${rowIndex}-${columnIndex}`"
                            :error="isError(rowIndex, columnIndex)"
                            :group-effect-id="groupEffect?.id ?? null"
                            :group-kinds="groupKindsAt(rowIndex, columnIndex)"
                            :highlight-same-digit="settingsStore.highlightSameDigit"
                            :hint="hintMode.cellViews.value?.[rowIndex][columnIndex] ?? null"
                            :peer="settingsStore.highlightScope && isPeerOfSelected(rowIndex, columnIndex)"
                            :puzzle-cell="puzzleCell.raw()"
                            :revealed="isRevealed(rowIndex, columnIndex)"
                            :selected-digit="highlightedDigit"
                            :row="rowIndex"
                            :selected="isSelected(rowIndex, columnIndex)"
                            @click="clickCell(rowIndex, columnIndex)"
                            @long-press="longPressCell(rowIndex, columnIndex)"
                        />
                    </template>
                    <GroupOverlay :effect="groupEffect" />
                    <FloatingDigitPad
                        v-if="floatingPadCell !== null"
                        :cell="floatingPadCell"
                        :current-entry="sudoku.puzzle[floatingPadCell.row][floatingPadCell.column].entry"
                        :current-notes="sudoku.puzzle[floatingPadCell.row][floatingPadCell.column].notes"
                        :digit-counts="digitCounts"
                        :erase-disabled="eraseDisabled"
                        :note-mode="inputMode === InputMode.Note"
                        @erase="toggleEraseMode"
                        @select-digit="selectDigit"
                    />
                    <StepLinkOverlay
                        v-if="hintMode.active.value"
                        :links="hintMode.links.value"
                    />
                </SudokuBoard>
            </BoardFrame>

            <!-- The hint panel covers the controls in place, so the board never moves. -->
            <div
                ref="inputArea"
                class="relative w-full"
            >
                <div
                    :class="hintMode.active.value ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-100'"
                    :inert="hintMode.active.value || undefined"
                    class="flex flex-col items-center gap-(--game-section-gap) transition-opacity duration-200"
                    data-testid="game-inputs"
                >
                    <GameControls
                        :note-active="inputMode === InputMode.Note"
                        @undo="undo"
                        @toggle-note-mode="toggleNoteMode"
                        @show-hint-menu="openHintMenu"
                    />

                    <DigitPad
                        :digit-counts="digitCounts"
                        :erase-active="inputMode === InputMode.Erase"
                        :erase-disabled="eraseDisabled"
                        :note-mode="inputMode === InputMode.Note"
                        :selected-digit="selectedDigit"
                        :show-remaining-count="settingsStore.showRemainingCount"
                        @select-digit="selectDigit"
                        @toggle-erase-mode="toggleEraseMode"
                    />
                </div>

                <Transition name="panel-rise">
                    <!-- On short screens the panel rises over the bottom of the board, so its buttons stay on screen. -->
                    <div
                        v-if="hintMode.active.value"
                        ref="hintPanelPosition"
                        :style="{ top: `${-hintPanelLift}px` }"
                        class="absolute inset-x-0 z-10"
                        data-tap-area
                        data-testid="hint-panel-position"
                    >
                        <HintPanel
                            :digit="hintMode.answer.value?.digit ?? null"
                            :is-last-step="hintMode.isLastStep.value"
                            :max-height="hintPanelMaxHeight"
                            :phase="hintMode.phase.value"
                            :step="hintMode.currentStep.value"
                            :step-index="hintMode.stepIndex.value"
                            :total-steps="hintMode.steps.value.length"
                            :wrong-cell="hintMode.wrongCell.value"
                            @clear="hintMode.clearWrongEntry"
                            @close="hintMode.close"
                            @fill="hintMode.fill"
                            @go-to="hintMode.goTo"
                            @next="hintMode.next"
                            @previous="hintMode.previous"
                        />
                    </div>
                </Transition>
            </div>
        </div>

        <div class="flex-1" />

        <GameCompleteModal />

        <HintMenuPopup />

        <GameToast :content="toastContent" />

        <LeaveGameDialog />
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef, watch } from "vue";
import GameHeader from "@/presentation/pages/game/components/GameHeader.vue";
import GameCompleteModal from "@/presentation/pages/game/components/GameCompleteModal.vue";
import LeaveGameDialog from "@/presentation/pages/game/components/LeaveGameDialog.vue";
import GameControls from "@/presentation/pages/game/components/GameControls.vue";
import HintMenuPopup from "@/presentation/pages/game/components/HintMenuPopup.vue";
import GameToast from "@/presentation/pages/game/components/GameToast.vue";
import DigitPad from "@/presentation/components/digit-pad/DigitPad.vue";
import FloatingDigitPad from "@/presentation/components/floating-digit-pad/FloatingDigitPad.vue";
import Cell from "@/presentation/components/board-cell/Cell.vue";
import BoardFrame from "@/presentation/components/board-frame/BoardFrame.vue";
import SudokuBoard from "@/presentation/components/sudoku-board/SudokuBoard.vue";
import GroupOverlay from "@/presentation/components/style-moments/GroupOverlay.vue";
import BoardCanvas from "@/presentation/components/style-moments/BoardCanvas.vue";
import { GROUP_RIPPLE_STEP_MS } from "@/presentation/pages/game/useGroupEffect";
import StepLinkOverlay from "@/presentation/components/step-presentation/StepLinkOverlay.vue";
import HintPanel from "@/presentation/pages/game/hint-mode/HintPanel.vue";
import { minimumPanelHeight } from "@/presentation/components/step-presentation/panelLift";
import { usePanelLift } from "@/presentation/components/step-presentation/usePanelLift";
import { InputMode } from "@/presentation/pages/game/InputMode";
import { isBlankTap } from "@/presentation/composables/isBlankTap";
import { useBlankDoubleTap } from "@/presentation/pages/game/useBlankDoubleTap";
import { useGameInteraction } from "@/presentation/pages/game/useGameInteraction";
import { useGameSession } from "@/presentation/pages/game/useGameSession";
import { useSettingsStore } from "@/stores/settingsStore";
import type { CellReference } from "@/domain/solver/SolveStep";

const emit = defineEmits<{ playAgain: [] }>();

const {
    sudoku,
    stepRecorder,
    elapsedSeconds,
    clearErrors,
    isError,
    isRevealed,
    openHintMenu,
    hintMode,
    singleNoteFill,
    completed,
    difficulty,
    toastContent,
    showLeaveDialog,
    checkAndComplete,
    playGroupEffect,
    celebration,
    groupEffect,
    groupKindsAt,
} = useGameSession({
    onPlayAgain: () => { emit("playAgain"); },
    // Or the pad would come back on the old cell by itself and could cover the one the hint revealed
    onCellRevealed: () => { if (settingsStore.floatingDigitPad) clearSelection(); },
});

const settingsStore = useSettingsStore();

// The moments the style's board canvas draws in the skin's place
const boardCanvasTakes = ref<string | undefined>(undefined);

// The panel opens over the controls; keep its buttons on screen when an explanation runs long
const hintPanelPosition = useTemplateRef<HTMLElement>("hintPanelPosition");
const { lift: hintPanelLift, maxHeight: hintPanelMaxHeight } = usePanelLift({
    inputArea: useTemplateRef<HTMLElement>("inputArea"),
    bottomGap: 16,
    open: () => hintMode.active.value,
    panelHeight: () => {
        const panel = hintPanelPosition.value?.querySelector<HTMLElement>("[data-testid='hint-panel']");
        return panel ? minimumPanelHeight(panel) : null;
    },
    // Measured again once the panel shows each step
    remeasureOn: [() => hintMode.active.value, () => hintMode.stepIndex.value, () => hintMode.phase.value],
});

const {
    selectedCell,
    selectedDigit,
    highlightedDigit,
    inputMode,
    clickCell,
    longPressCell,
    selectDigit,
    toggleNoteMode,
    toggleEraseMode,
    eraseDisabled,
    isSelected,
    isPeerOfSelected,
    digitCounts,
    clearSelection,
    releaseCompletedDigit,
    undo,
} = useGameInteraction({
    sudoku: sudoku.raw(),
    stepRecorder,
    clearErrors,
    checkAndComplete,
    onGroupCompleted: playGroupEffect,
    autoRemoveNotes: () => settingsStore.autoRemoveNotes,
    // A solved board takes no more input, while it celebrates as after
    isLocked: () => completed.value || hintMode.active.value || singleNoteFill.running.value,
});

const { isDoubleTap } = useBlankDoubleTap();

// Easy games keep it off whatever the setting says: there it would all but solve the game
const canFillSingleNotes = (): boolean => settingsStore.doubleTapFill
    && difficulty.value !== "easy"
    && !completed.value
    && !hintMode.active.value
    && !singleNoteFill.running.value;

// The selected cell, when the floating pad belongs on it: not on a clue, and not while the board ignores the player
const floatingPadCell = computed((): CellReference | null => {
    if (!settingsStore.floatingDigitPad || selectedCell.value === null) return null;
    if (hintMode.active.value || singleNoteFill.running.value || celebration.value !== null) return null;
    if (selectedDigit.value !== null || inputMode.value === InputMode.Erase) return null;
    const { row, column } = selectedCell.value;
    return sudoku.puzzle[row][column].isClue ? null : selectedCell.value;
});

const handleScreenTap = (event: MouseEvent) => {
    if (settingsStore.floatingDigitPad && !hintMode.active.value && isBlankTap(event.target)) clearSelection();
    if (!isDoubleTap(event) || !canFillSingleNotes()) return;
    clearSelection();
    singleNoteFill.start();
};

// Sync, as a one-cell or motion-off run starts and ends in one tick, which a queued watcher never sees
watch(() => singleNoteFill.running.value, (running) => {
    if (!running) releaseCompletedDigit();
}, { flush: "sync" });

// A running group effect's origin and timing, for the cells' CSS to ripple from
const groupEffectPlacement = computed(() => {
    if (groupEffect.value === null) return undefined;
    return {
        "--origin-row": groupEffect.value.origin.row,
        "--origin-column": groupEffect.value.origin.column,
        "--group-ripple-step": `${GROUP_RIPPLE_STEP_MS}ms`,
    };
});


// The cell a style's board frame points at: none while the solved board celebrates, the answer's in hint mode,
// and otherwise the selected one
const frameTarget = computed((): CellReference | null => {
    if (celebration.value !== null) return null;
    if (hintMode.active.value) return hintMode.answer.value?.cell ?? null;
    return selectedCell.value;
});
</script>
