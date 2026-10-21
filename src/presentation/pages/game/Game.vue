<template>
    <div
        v-if="gameStore.hasActiveGame"
        class="flex flex-col gap-2 h-dvh py-6 px-5"
    >
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
                            :puzzle-cell="puzzleCell.raw()"
                            :revealed="isRevealed(rowIndex, columnIndex)"
                            :selected-digit="selectedDigit"
                            :row="rowIndex"
                            :selected="isSelected(rowIndex, columnIndex)"
                            @click="clickCell(rowIndex, columnIndex)"
                            @long-press="longPressCell(rowIndex, columnIndex)"
                        />
                    </div>
                    <HintLinkOverlay
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
                        :selected-digit="selectedDigit"
                        :show-remaining-count="settingsStore.showRemainingCount"
                        @select-digit="selectDigit"
                        @toggle-erase-mode="toggleEraseMode"
                    />
                </div>

                <Transition name="hint-panel">
                    <div
                        v-if="hintMode.active.value"
                        class="absolute top-0 inset-x-0 z-10"
                    >
                        <HintPanel
                            :digit="hintMode.answer.value?.digit ?? null"
                            :is-last-step="hintMode.isLastStep.value"
                            :max-height="roomBelowInputArea"
                            :phase="hintMode.phase.value"
                            :step="hintMode.currentStep.value"
                            :step-index="hintMode.stepIndex.value"
                            :total-steps="hintMode.steps.value.length"
                            :wrong-cell="hintMode.wrongCell.value"
                            @cancel="hintMode.cancel"
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

        <HintResultToast :outcome="hintResultOutcome" />

        <LeaveGameDialog />
    </div>
</template>

<script lang="ts" setup>
import { useTemplateRef, watch } from "vue";
import GameHeader from "@/presentation/pages/game/components/GameHeader.vue";
import GameCompleteModal from "@/presentation/pages/game/components/GameCompleteModal.vue";
import LeaveGameDialog from "@/presentation/pages/game/components/LeaveGameDialog.vue";
import GameControls from "@/presentation/pages/game/components/GameControls.vue";
import HintMenuPopup from "@/presentation/pages/game/components/HintMenuPopup.vue";
import HintResultToast from "@/presentation/pages/game/components/HintResultToast.vue";
import DigitPad from "@/presentation/pages/game/components/DigitPad.vue";
import Cell from "@/presentation/pages/game/components/Cell.vue";
import HintLinkOverlay from "@/presentation/pages/game/hint-mode/HintLinkOverlay.vue";
import HintPanel from "@/presentation/pages/game/hint-mode/HintPanel.vue";
import { useRoomBelow } from "@/presentation/pages/game/hint-mode/useRoomBelow";
import { InputMode } from "@/presentation/pages/game/InputMode";
import { useGameInteraction } from "@/presentation/pages/game/useGameInteraction";
import { useGameSession } from "@/presentation/pages/game/useGameSession";
import { useSettingsStore } from "@/stores/settingsStore";

const {
    gameStore,
    sudoku,
    stepRecorder,
    elapsedSeconds,
    clearErrors,
    isError,
    isRevealed,
    openHintMenu,
    hintMode,
    hintResultOutcome,
    showLeaveDialog,
    checkAndComplete,
    triggerFlash,
    isFlashing,
} = useGameSession();

const settingsStore = useSettingsStore();

// The panel opens over the controls; keep its buttons on screen when an explanation runs long.
// It stops this many pixels short of the screen's bottom edge.
const HINT_PANEL_BOTTOM_GAP = 16;
const inputAreaElement = useTemplateRef<HTMLElement>("inputArea");
const { room: roomBelowInputArea, measure: measureRoomBelowInputArea } = useRoomBelow(inputAreaElement, HINT_PANEL_BOTTOM_GAP);
watch(() => hintMode.active.value, (active) => {
    if (active) measureRoomBelowInputArea();
});

const {
    selectedDigit,
    inputMode,
    clickCell,
    longPressCell,
    selectDigit,
    toggleNoteMode,
    toggleEraseMode,
    isSelected,
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
