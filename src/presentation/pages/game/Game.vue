<template>
    <div
        v-if="gameStore.hasActiveGame"
        class="flex flex-col gap-2 h-dvh py-6 px-5"
    >
        <!-- Header -->
        <GameHeader
            :elapsed-seconds="elapsedSeconds"
            @back="showLeaveDialog"
        />

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- Game Area -->
        <div class="flex flex-col items-center gap-6">
            <!-- Board Container -->
            <div class="bg-card rounded-2xl shadow-card-lg p-2 w-full">
                <div class="flex flex-col border-3 border-foreground/20 rounded-xl">
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
                            :puzzle-cell="puzzleCell.raw()"
                            :selected-digit="selectedDigit"
                            :row="rowIndex"
                            :selected="isSelected(rowIndex, columnIndex)"
                            @click="clickCell(rowIndex, columnIndex)"
                        />
                    </div>
                </div>
            </div>

            <!-- Controls -->
            <GameControls
                :note-active="inputMode === InputMode.Note"
                @undo="undo"
                @toggle-note-mode="toggleNoteMode"
                @show-hint-menu="openHintMenu"
            />

            <!-- Digit Pad -->
            <DigitPad
                :digit-counts="digitCounts"
                :erase-active="inputMode === InputMode.Erase"
                :selected-digit="selectedDigit"
                :show-remaining-count="settingsStore.showRemainingCount"
                @select-digit="selectDigit"
                @toggle-erase-mode="toggleEraseMode"
            />
        </div>

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- Game Complete Modal -->
        <GameCompleteModal />

        <!-- Hint Menu Popup -->
        <HintMenuPopup />

        <!-- Leave Game Dialog -->
        <LeaveGameDialog />
    </div>
</template>

<script lang="ts" setup>
import GameHeader from "@/presentation/pages/game/components/GameHeader.vue";
import GameCompleteModal from "@/presentation/pages/game/components/GameCompleteModal.vue";
import LeaveGameDialog from "@/presentation/pages/game/components/LeaveGameDialog.vue";
import GameControls from "@/presentation/pages/game/components/GameControls.vue";
import HintMenuPopup from "@/presentation/pages/game/components/HintMenuPopup.vue";
import DigitPad from "@/presentation/pages/game/components/DigitPad.vue";
import Cell from "@/presentation/pages/game/components/Cell.vue";
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
    openHintMenu,
    showLeaveDialog,
    checkAndComplete,
    triggerFlash,
    isFlashing,
} = useGameSession();

const settingsStore = useSettingsStore();

const {
    selectedDigit,
    inputMode,
    clickCell,
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
});
</script>
