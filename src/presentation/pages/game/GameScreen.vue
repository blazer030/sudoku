<template>
    <div class="flex flex-col gap-2 min-h-full py-6 px-5">
        <GameHeader
            :elapsed-seconds="elapsedSeconds"
            :hint-mode="hintMode.active.value"
            @back="showLeaveDialog"
        />

        <div class="flex-1" />

        <div class="flex flex-col items-center gap-6">
            <div
                :class="hintMode.active.value ? 'ring-2 ring-primary/50' : 'ring-0 ring-transparent'"
                class="bg-card rounded-2xl shadow-card-lg p-2 w-full transition-shadow duration-300"
                data-skin="board"
                data-testid="game-board"
            >
                <div class="relative flex flex-col border-3 border-foreground/20 rounded-xl">
                    <div
                        v-for="(row, rowIndex) in sudoku.puzzle"
                        :key="rowIndex"
                        class="flex"
                    >
                        <Cell
                            v-for="(puzzleCell, columnIndex) in row"
                            :key="`cell-${rowIndex}-${columnIndex}`"
                            :column="columnIndex"
                            :data-testid="`cell-${rowIndex}-${columnIndex}`"
                            :error="isError(rowIndex, columnIndex)"
                            :flashing="isFlashing(rowIndex, columnIndex)"
                            :highlight-same-digit="settingsStore.highlightSameDigit"
                            :hint="hintMode.cellViews.value?.[rowIndex][columnIndex] ?? null"
                            :peer="settingsStore.highlightScope && isPeerOfSelected(rowIndex, columnIndex)"
                            :puzzle-cell="puzzleCell.raw()"
                            :revealed="isRevealed(rowIndex, columnIndex)"
                            :selected-digit="selectedDigit"
                            :row="rowIndex"
                            :selected="isSelected(rowIndex, columnIndex)"
                            @click="clickCell(rowIndex, columnIndex)"
                            @long-press="longPressCell(rowIndex, columnIndex)"
                        />
                    </div>
                    <StepLinkOverlay
                        v-if="hintMode.active.value"
                        :links="hintMode.links.value"
                    />
                </div>
            </div>

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
                            @close="hintMode.cancel"
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
import DigitPad from "@/presentation/pages/game/components/DigitPad.vue";
import Cell from "@/presentation/pages/game/components/Cell.vue";
import StepLinkOverlay from "@/presentation/components/step-presentation/StepLinkOverlay.vue";
import HintPanel from "@/presentation/pages/game/hint-mode/HintPanel.vue";
import { useRoomBelow } from "@/presentation/pages/game/hint-mode/useRoomBelow";
import { minimumPanelHeight, panelLift } from "@/presentation/pages/game/hint-mode/panelLift";
import { InputMode } from "@/presentation/pages/game/InputMode";
import { useGameInteraction } from "@/presentation/pages/game/useGameInteraction";
import { useGameSession } from "@/presentation/pages/game/useGameSession";
import { useLongPressTip } from "@/presentation/pages/game/useLongPressTip";
import { useSettingsStore } from "@/stores/settingsStore";

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
    toastContent,
    showToast,
    showLeaveDialog,
    checkAndComplete,
    triggerFlash,
    isFlashing,
} = useGameSession({ onPlayAgain: () => { emit("playAgain"); } });

const settingsStore = useSettingsStore();

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
    selectedDigit,
    inputMode,
    clickCell,
    longPressCell,
    selectDigit,
    toggleNoteMode,
    toggleEraseMode,
    isSelected,
    isPeerOfSelected,
    digitCounts,
    undo,
} = useGameInteraction({
    sudoku: sudoku.raw(),
    stepRecorder,
    clearErrors,
    checkAndComplete,
    onGroupCompleted: triggerFlash,
    autoRemoveNotes: () => settingsStore.autoRemoveNotes,
    isLocked: () => hintMode.active.value,
});

useLongPressTip({ selectedDigit, showTip: () => { showToast({ kind: "longPressTip" }); } });
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
