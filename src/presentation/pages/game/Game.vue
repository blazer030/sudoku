<template>
    <div class="flex flex-col gap-6 h-dvh py-6 px-5">
        <!-- Header -->
        <GameHeader
            :elapsed-seconds="elapsedSeconds"
            @back="showLeaveDialog"
        />

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- Board Container -->
        <div class="bg-card rounded-2xl shadow-[0_2px_12px_#1A191808] p-2">
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
                        :selected="isSelected(rowIndex, columnIndex)"
                        @click="clickCell(rowIndex, columnIndex)"
                    />
                </div>
            </div>
        </div>

        <!-- Game Complete Modal -->
        <GameCompleteModal
            v-if="completed"
            :difficulty="gameStore.difficulty ?? 'easy'"
            :elapsed-seconds="elapsedSeconds"
        />

        <!-- Leave Game Dialog -->
        <LeaveGameDialog
            v-if="showLeave"
            @save-and-leave="handleSaveAndLeave"
            @give-up-and-leave="handleGiveUpAndLeave"
            @cancel="showLeave = false"
        />

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- Controls -->
        <div class="flex items-center justify-between">
            <ControlButton
                :icon="Undo2"
                data-testid="undo-button"
                label="Undo"
                @click="sudoku.undo()"
            />
            <ControlButton
                :active="inputMode === InputMode.Erase"
                :icon="Eraser"
                data-testid="erase-button"
                label="Erase"
                @click="toggleEraseMode"
            />
            <ControlButton
                :active="inputMode === InputMode.Note"
                :icon="Pencil"
                data-testid="note-button"
                label="Notes"
                @click="toggleNoteMode"
            />
            <ControlButton
                :icon="Sparkles"
                data-testid="auto-notes-button"
                label="Auto"
                @click="sudoku.autoNotes()"
            />
        </div>

        <!-- Digit Pad -->
        <div class="flex gap-1.5">
            <div
                v-for="digit in 9"
                :key="`num-${digit}`"
                class="relative flex-1 min-w-0"
            >
                <button
                    :class="digitButtonClasses(digit)"
                    :data-testid="`number-${digit}`"
                    :disabled="isDigitCompleted(digit)"
                    class="w-full h-12 rounded-xl flex items-center justify-center text-2xl font-semibold transition-all cursor-pointer disabled:cursor-default"
                    @click="selectDigit(digit)"
                >
                    {{ digit }}
                </button>
                <span
                    v-if="!isDigitCompleted(digit)"
                    :class="selectedDigit === digit
                        ? 'bg-white text-primary'
                        : 'bg-foreground-secondary text-white'"
                    :data-testid="`badge-${digit}`"
                    class="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold"
                >
                    {{ getRemainingCount(digit) }}
                </span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, reactive, ref } from "vue";

import { useRouter } from "vue-router";
import { Eraser, Pencil, Sparkles, Undo2 } from "lucide-vue-next";
import GameHeader from "@/presentation/components/game-header/GameHeader.vue";
import GameCompleteModal from "@/presentation/components/game-complete-modal/GameCompleteModal.vue";
import LeaveGameDialog from "@/presentation/components/leave-game-dialog/LeaveGameDialog.vue";
import ControlButton from "@/presentation/components/game-controls/ControlButton.vue";
import Sudoku from "@/domain/Sudoku";
import CellHighlight from "@/domain/CellHighlight";
import Cell from "@/presentation/components/cell/Cell.vue";
import { useGameStore } from "@/stores/gameStore";
import { ROUTER_PATH } from "@/router";
import { deleteSavedGame, loadGame, saveGame } from "@/application/GameStorage";
import { GameStateConverter } from "@/application/GameState";
import { recordGameResult } from "@/application/Statistics";

const router = useRouter();
const gameStore = useGameStore();

if (!gameStore.hasActiveGame) {
    void router.replace(ROUTER_PATH.home);
}

const sudoku = (() => {
    if (gameStore.sudoku) {
        const instance = reactive(new Sudoku());
        instance.restore(gameStore.sudoku.answer, gameStore.sudoku.puzzle);
        return instance;
    }
    if (gameStore.continueGame) {
        const saved = loadGame();
        if (saved) {
            const raw = GameStateConverter.toSudoku(saved);
            const instance = reactive(new Sudoku());
            instance.restore(raw.answer, raw.puzzle);
            return instance;
        }
    }
    const instance = reactive(new Sudoku());
    instance.generate(gameStore.difficulty ?? "easy");
    return instance;
})();

enum InputMode { Normal, Note, Erase }

const selectedCell = ref<{ row: number; column: number } | null>(null);
const selectedDigit = ref<number | null>(null);
const completed = ref(false);
const showLeave = ref(false);
const inputMode = ref(InputMode.Normal);
const elapsedSeconds = ref(gameStore.elapsedSeconds);

const timerInterval = setInterval(() => {
    if (!completed.value && !showLeave.value) {
        elapsedSeconds.value++;
    }
}, 1000);

onBeforeUnmount(() => {
    clearInterval(timerInterval);
});

function showLeaveDialog() {
    showLeave.value = true;
}

function handleSaveAndLeave() {
    const state = GameStateConverter.fromSudoku(sudoku.raw(), {
        difficulty: gameStore.difficulty ?? "easy",
        elapsedSeconds: elapsedSeconds.value,
        completed: completed.value,
    });
    saveGame(state);
    void router.push(ROUTER_PATH.home);
}

function handleGiveUpAndLeave() {
    recordGameResult({
        difficulty: gameStore.difficulty ?? "easy",
        elapsedSeconds: elapsedSeconds.value,
        completed: false,
    });
    deleteSavedGame();
    void router.push(ROUTER_PATH.home);
}

function clickCell(row: number, column: number) {
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
    if (sudoku.isCompleted()) {
        completed.value = true;
        recordGameResult({
            difficulty: gameStore.difficulty ?? "easy",
            elapsedSeconds: elapsedSeconds.value,
            completed: true,
        });
    }
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
    for (let row = 0; row < 9; row++) {
        grid[row] = [];
        for (let column = 0; column < 9; column++) {
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
            } else if (Math.floor(row / 3) === Math.floor(sr / 3)
                && Math.floor(column / 3) === Math.floor(sc / 3)) {
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
    for (let row = 0; row < 9; row++) {
        for (let column = 0; column < 9; column++) {
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

function getRemainingCount(digit: number): number {
    return 9 - digitCounts.value[digit];
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

function digitButtonClasses(digit: number): string {
    if (isDigitCompleted(digit)) return "bg-card opacity-50 text-foreground-muted";
    if (selectedDigit.value === digit) return "bg-primary text-white shadow-[0_2px_8px_#3D8A5A40]";
    return "bg-card text-foreground shadow-[0_1px_4px_#1A191808]";
}
</script>
