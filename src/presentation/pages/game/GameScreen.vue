<template>
    <div
        class="flex flex-col gap-2 min-h-full py-6 px-5 touch-manipulation"
        data-testid="game-screen"
        @click="handleScreenTap"
    >
        <GameHeader
            :elapsed-seconds="elapsedSeconds"
            :hint-mode="hintMode.active.value"
            @back="showLeaveDialog"
        />

        <div class="flex-1" />

        <div class="flex flex-col items-center gap-6">
            <BoardFrame
                :celebration="celebration"
                :effect="groupEffect"
                :target="frameTarget"
            >
                <div
                    :class="hintMode.active.value ? 'ring-2 ring-primary/50' : 'ring-0 ring-transparent'"
                    :data-board-canvas="boardCanvasTakes"
                    :data-celebration="celebration ?? undefined"
                    :data-group-effect="groupEffect?.id"
                    :data-hint-mode="hintMode.active.value || undefined"
                    :data-selected-cell="selectedCellName"
                    class="bg-card rounded-2xl shadow-card-lg p-2 self-center w-[calc(100%+1.5rem)] max-w-board-fit transition-shadow duration-300"
                    :style="groupEffectPlacement"
                    data-skin="board"
                    data-testid="game-board"
                >
                    <BoardCanvas
                        v-model:takes="boardCanvasTakes"
                        :celebration="celebration"
                        :effect="groupEffect"
                    />
                    <div
                        class="relative flex flex-col border-3 border-foreground/20 rounded-xl"
                        data-skin="board-grid"
                    >
                        <div
                            v-for="(row, rowIndex) in sudoku.puzzle"
                            :key="rowIndex"
                            class="grid grid-cols-9"
                        >
                            <Cell
                                v-for="(puzzleCell, columnIndex) in row"
                                :key="`cell-${rowIndex}-${columnIndex}`"
                                :column="columnIndex"
                                :data-testid="`cell-${rowIndex}-${columnIndex}`"
                                :error="isError(rowIndex, columnIndex)"
                                :group-effect-id="groupEffect?.id ?? null"
                                :group-kinds="isInGroupEffect(rowIndex, columnIndex)"
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
                        </div>
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
                    </div>
                </div>
            </BoardFrame>

            <!-- The hint panel covers the controls in place, so the board never moves. -->
            <div
                ref="inputArea"
                class="relative w-full"
            >
                <div
                    :class="hintMode.active.value ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-100'"
                    :inert="hintMode.active.value || undefined"
                    class="flex flex-col items-center gap-6 transition-opacity duration-200"
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

                <Transition name="hint-panel">
                    <!-- On short screens the panel rises over the bottom of the board, so its buttons stay on screen. -->
                    <div
                        v-if="hintMode.active.value"
                        ref="hintPanelPosition"
                        :style="{ top: `${-hintPanelLift}px` }"
                        class="absolute inset-x-0 z-10"
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
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
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
import { cellName } from "@/presentation/components/board-cell/cellName";
import GroupOverlay from "@/presentation/components/style-moments/GroupOverlay.vue";
import BoardCanvas from "@/presentation/components/style-moments/BoardCanvas.vue";
import { GROUP_RIPPLE_STEP_MS } from "@/presentation/pages/game/useGroupEffect";
import StepLinkOverlay from "@/presentation/components/step-presentation/StepLinkOverlay.vue";
import HintPanel from "@/presentation/pages/game/hint-mode/HintPanel.vue";
import { useRoomBelow } from "@/presentation/composables/useRoomBelow";
import { minimumPanelHeight, panelLift } from "@/presentation/components/step-presentation/panelLift";
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
    isInGroupEffect,
} = useGameSession({ onPlayAgain: () => { emit("playAgain"); } });

const settingsStore = useSettingsStore();

// The moments the style's board canvas draws in the skin's place
const boardCanvasTakes = ref<string | undefined>(undefined);

// The panel opens over the controls; keep its buttons on screen when an explanation runs long.
// It stops this many pixels short of the screen's bottom edge.
const HINT_PANEL_BOTTOM_GAP = 16;
const inputAreaElement = useTemplateRef<HTMLElement>("inputArea");
const { room: roomBelowInputArea, measure: measureRoomBelowInputArea } = useRoomBelow(inputAreaElement, HINT_PANEL_BOTTOM_GAP);
watch(() => hintMode.active.value, (active) => {
    if (active) measureRoomBelowInputArea();
});

const hintPanelPosition = useTemplateRef<HTMLElement>("hintPanelPosition");
const hintPanelLift = ref(0);
const hintPanelMaxHeight = computed(() =>
    roomBelowInputArea.value === null ? null : roomBelowInputArea.value + hintPanelLift.value);

const measureHintPanelLift = () => {
    const panel = hintPanelPosition.value?.querySelector<HTMLElement>("[data-testid='hint-panel']");
    if (!panel || roomBelowInputArea.value === null) {
        hintPanelLift.value = 0;
        return;
    }
    hintPanelLift.value = panelLift(roomBelowInputArea.value, minimumPanelHeight(panel));
};

// Re-measured once the panel shows each step, and whenever the room changes
watch(
    () => [hintMode.active.value, hintMode.stepIndex.value, hintMode.phase.value, roomBelowInputArea.value],
    () => { void nextTick(measureHintPanelLift); },
);

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
    isLocked: () => hintMode.active.value || singleNoteFill.running.value,
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

watch(() => singleNoteFill.running.value, (running) => {
    if (!running) releaseCompletedDigit();
});

// A running group effect's origin and timing, for the cells' CSS to ripple from
const groupEffectPlacement = computed(() => {
    if (groupEffect.value === null) return undefined;
    return {
        "--origin-row": groupEffect.value.origin.row,
        "--origin-column": groupEffect.value.origin.column,
        "--group-ripple-step": `${GROUP_RIPPLE_STEP_MS}ms`,
    };
});

const selectedCellName = computed(() => selectedCell.value === null ? undefined : cellName(selectedCell.value.row, selectedCell.value.column));

// The cell a style's board frame points at: none while the solved board celebrates, the answer's in hint mode,
// and otherwise the selected one
const frameTarget = computed((): CellReference | null => {
    if (celebration.value !== null) return null;
    if (hintMode.active.value) return hintMode.answer.value?.cell ?? null;
    return selectedCell.value;
});
</script>

<style scoped>
.hint-panel-enter-active {
    transition: opacity 220ms ease, transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.hint-panel-leave-active {
    transition: opacity 150ms ease, transform 200ms ease;
}

.hint-panel-enter-from,
.hint-panel-leave-to {
    opacity: 0;
    transform: translateY(16px);
}
</style>
