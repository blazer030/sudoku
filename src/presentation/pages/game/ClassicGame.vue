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
                            :highlight="highlightGrid[rowIndex][columnIndex]"
                            :puzzle-cell="puzzleCell.raw()"
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
                @undo="sudoku.undo()"
                @toggle-note-mode="toggleNoteMode"
                @show-hint-menu="openHintMenu"
            />

            <!-- Digit Pad -->
            <DigitPad
                :digit-counts="digitCounts"
                :erase-active="inputMode === InputMode.Erase"
                :selected-digit="selectedDigit"
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
import GameHeader from "@/presentation/themes/classic/components/GameHeader.vue";
import GameCompleteModal from "@/presentation/themes/classic/components/GameCompleteModal.vue";
import LeaveGameDialog from "@/presentation/themes/classic/components/LeaveGameDialog.vue";
import GameControls from "@/presentation/themes/classic/components/GameControls.vue";
import HintMenuPopup from "@/presentation/themes/classic/components/HintMenuPopup.vue";
import DigitPad from "@/presentation/themes/classic/components/DigitPad.vue";
import Cell from "@/presentation/themes/classic/components/Cell.vue";
import { InputMode } from "./InputMode";
import { useGameInteraction } from "./useGameInteraction";
import { useGameSession } from "./useGameSession";

const {
    gameStore,
    sudoku,
    elapsedSeconds,
    clearErrors,
    isError,
    openHintMenu,
    showLeaveDialog,
    checkAndComplete,
} = useGameSession();

const {
    selectedDigit,
    inputMode,
    clickCell,
    selectDigit,
    toggleNoteMode,
    toggleEraseMode,
    isSelected,
    highlightGrid,
    digitCounts,
} = useGameInteraction({
    sudoku: sudoku.raw(),
    clearErrors,
    checkAndComplete,
});
</script>
