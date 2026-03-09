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
                            :highlight="highlightGrid[rowIndex][columnIndex]"
                            :puzzle-cell="puzzleCell.raw()"
                            :row="rowIndex"
                            :error="isError(rowIndex, columnIndex)"
                            :selected="isSelected(rowIndex, columnIndex)"
                            @click="clickCell(rowIndex, columnIndex)"
                        />
                    </div>
                </div>
            </div>

            <!-- Controls -->
            <div class="flex justify-center gap-6">
                <ControlButton
                    :icon="Undo2"
                    data-testid="undo-button"
                    @click="sudoku.undo()"
                />
                <ControlButton
                    :active="inputMode === InputMode.Note"
                    :icon="Pencil"
                    data-testid="note-button"
                    @click="toggleNoteMode"
                />
                <ControlButton
                    :icon="Lightbulb"
                    data-testid="hint-button"
                    @click="openHintMenu"
                />
            </div>

            <!-- Digit Pad -->
            <DigitPad
                :selected-digit="selectedDigit"
                :erase-active="inputMode === InputMode.Erase"
                :digit-counts="digitCounts"
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
import { computed, reactive, ref } from "vue";

import { useRouter } from "vue-router";
import { Lightbulb, Pencil, Undo2 } from "lucide-vue-next";
import GameHeader from "@/presentation/components/game-header/GameHeader.vue";
import GameCompleteModal from "@/presentation/components/game-complete-modal/GameCompleteModal.vue";
import { provideGameCompleteModal } from "@/presentation/components/game-complete-modal/useGameCompleteModal";
import LeaveGameDialog from "@/presentation/components/leave-game-dialog/LeaveGameDialog.vue";
import ControlButton from "@/presentation/components/game-controls/ControlButton.vue";
import HintMenuPopup from "@/presentation/components/hint-menu-popup/HintMenuPopup.vue";
import DigitPad from "@/presentation/components/digit-pad/DigitPad.vue";
import Sudoku from "@/domain/Sudoku";
import { BOARD_SIZE, BOX_SIZE } from "@/domain/constants";
import CellHighlight from "@/domain/CellHighlight";
import Cell from "@/presentation/components/cell/Cell.vue";
import { useGameStore } from "@/stores/gameStore";
import { ROUTER_PATH } from "@/router";
import InputMode from "./InputMode";
import { useGameTimer } from "./useGameTimer";
import { useGameCompletion } from "./useGameCompletion";
import { useLeaveGame } from "./useLeaveGame";
import { useHintActions } from "./useHintActions";

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
const selectedCell = ref<{ row: number; column: number } | null>(null);
const selectedDigit = ref<number | null>(null);
const inputMode = ref(InputMode.Normal);

const { completed, checkAndComplete } = useGameCompletion({
    sudoku,
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

const { clearErrors, isError, openHintMenu } = useHintActions({
    sudoku,
    onRevealComplete: checkAndComplete,
});

const { leaveDialog, showLeaveDialog } = useLeaveGame({
    sudoku,
    difficulty,
    completed,
    getElapsedSeconds: () => elapsedSeconds.value,
});

const timerPaused = computed(() => completed.value || leaveDialog.visible.value);
const { elapsedSeconds } = useGameTimer({
    initialSeconds: gameStore.elapsedSeconds,
    paused: timerPaused,
});


function clickCell(row: number, column: number) {
    clearErrors();
    if (inputMode.value === InputMode.Erase) {
        eraseCell(row, column);
        return;
    }
    if (selectedDigit.value !== null) {
        if (inputMode.value === InputMode.Note) {
            noteToCell(row, column, selectedDigit.value);
        } else {
            inputToCell(row, column, selectedDigit.value);
        }
        return;
    }
    toggleSelectCell(row, column);
}

function noteToCell(row: number, column: number, value: number) {
    sudoku.toggleNote(row, column, value);
}

function inputToCell(row: number, column: number, value: number) {
    if (sudoku.puzzle[row][column].isClue) return;
    if (sudoku.puzzle[row][column].entry === value) {
        sudoku.fill(row, column, 0);
        return;
    }
    sudoku.fill(row, column, value);
    checkAndComplete();
    if (isDigitCompleted(value)) selectedDigit.value = null;
}

function toggleSelectCell(row: number, column: number) {
    if (sudoku.puzzle[row][column].isClue) return;
    if (isSelected(row, column)) {
        selectedCell.value = null;
        return;
    }
    selectedCell.value = { row, column };
}

function isSelected(row: number, column: number) {
    if (selectedCell.value === null) return false;
    if (selectedCell.value.row !== row) return false;
    return selectedCell.value.column === column;
}

const highlightGrid = computed(() => {
    const grid: CellHighlight[][] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        grid[row] = [];
        for (let column = 0; column < BOARD_SIZE; column++) {
            const cell = sudoku.puzzle[row][column];
            const cellValue = cell.isClue ? cell.clue : cell.entry;
            if (selectedDigit.value && cellValue === selectedDigit.value) {
                grid[row][column] = CellHighlight.SameDigit;
                continue;
            }
            if (!selectedCell.value) {
                grid[row][column] = CellHighlight.None;
                continue;
            }
            const sr = selectedCell.value.row;
            const sc = selectedCell.value.column;
            if (row === sr && column === sc) {
                grid[row][column] = CellHighlight.None;
            } else if (row === sr || column === sc) {
                grid[row][column] = CellHighlight.Peer;
            } else if (Math.floor(row / BOX_SIZE) === Math.floor(sr / BOX_SIZE)
                && Math.floor(column / BOX_SIZE) === Math.floor(sc / BOX_SIZE)) {
                grid[row][column] = CellHighlight.Peer;
            } else {
                grid[row][column] = CellHighlight.None;
            }
        }
    }
    return grid;
});

const digitCounts = computed(() => {
    const counts = Array.from<number, number>({ length: 10 }, () => 0);
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const cell = sudoku.puzzle[row][column];
            // 明確存取兩個屬性，確保 Vue 追蹤 _clue 和 _entry
            const v = cell.clue;
            const i = cell.entry;
            if (v > 0) counts[v]++;
            else if (i > 0) counts[i]++;
        }
    }
    return counts;
});

function isDigitCompleted(digit: number): boolean {
    return digitCounts.value[digit] >= 9;
}

function eraseCell(row: number, column: number) {
    sudoku.erase(row, column);
}

function toggleNoteMode() {
    inputMode.value = inputMode.value === InputMode.Note ? InputMode.Normal : InputMode.Note;
}

function toggleEraseMode() {
    inputMode.value = inputMode.value === InputMode.Erase ? InputMode.Normal : InputMode.Erase;
    if (inputMode.value === InputMode.Erase) {
        selectedCell.value = null;
        selectedDigit.value = null;
    }
}

function selectDigit(digit: number) {
    clearErrors();
    if (inputMode.value === InputMode.Erase) inputMode.value = InputMode.Normal;
    if (selectedCell.value) {
        const { row, column } = selectedCell.value;
        if (inputMode.value === InputMode.Note) {
            sudoku.toggleNote(row, column, digit);
            return;
        }
        inputToCell(row, column, digit);
        return;
    }
    selectedDigit.value = selectedDigit.value === digit ? null : digit;
}
</script>
