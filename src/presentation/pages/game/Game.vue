<template>
    <div class="flex flex-col gap-6 h-dvh py-6 px-5">
        <!-- Header -->
        <GameHeader :elapsed-seconds="elapsedSeconds" />

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

        <!-- Completed (placeholder, Step 5.5 will replace with modal) -->
        <div
            v-if="completed"
            class="text-center text-2xl font-bold text-primary my-4"
        >
            Completed
        </div>

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- Controls -->
        <div class="flex items-center justify-between">
            <button
                class="flex flex-col items-center gap-1 w-14 cursor-pointer"
                data-testid="undo-button"
                @click="sudoku.undo()"
            >
                <div class="w-11 h-11 rounded-xl bg-card shadow-[0_1px_4px_#1A191808] flex items-center justify-center">
                    <Undo2
                        :size="22"
                        class="text-foreground"
                    />
                </div>
                <span class="text-foreground-secondary text-[11px] font-medium">
                    Undo
                </span>
            </button>

            <button
                class="flex flex-col items-center gap-1 w-14 cursor-pointer"
                data-testid="erase-button"
                @click="toggleEraseMode"
            >
                <div
                    :class="inputMode === InputMode.Erase
                        ? 'bg-primary-light border-2 border-primary'
                        : 'bg-card shadow-[0_1px_4px_#1A191808]'"
                    class="w-11 h-11 rounded-xl flex items-center justify-center"
                >
                    <Eraser
                        :class="inputMode === InputMode.Erase ? 'text-primary' : 'text-foreground'"
                        :size="22"
                    />
                </div>
                <span
                    :class="inputMode === InputMode.Erase ? 'text-primary font-semibold' : 'text-foreground-secondary font-medium'"
                    class="text-[11px]"
                >
                    Erase
                </span>
            </button>

            <button
                class="flex flex-col items-center gap-1 w-14 cursor-pointer"
                data-testid="note-button"
                @click="toggleNoteMode"
            >
                <div
                    :class="inputMode === InputMode.Note
                        ? 'bg-primary-light border-2 border-primary'
                        : 'bg-card shadow-[0_1px_4px_#1A191808]'"
                    class="w-11 h-11 rounded-xl flex items-center justify-center"
                >
                    <Pencil
                        :class="inputMode === InputMode.Note ? 'text-primary' : 'text-foreground'"
                        :size="22"
                    />
                </div>
                <span
                    :class="inputMode === InputMode.Note ? 'text-primary font-semibold' : 'text-foreground-secondary font-medium'"
                    class="text-[11px]"
                >
                    Notes
                </span>
            </button>

            <button
                class="flex flex-col items-center gap-1 w-14 cursor-pointer"
                data-testid="auto-notes-button"
                @click="sudoku.autoNotes()"
            >
                <div class="w-11 h-11 rounded-xl bg-card shadow-[0_1px_4px_#1A191808] flex items-center justify-center">
                    <Sparkles
                        :size="22"
                        class="text-foreground"
                    />
                </div>
                <span class="text-foreground-secondary text-[11px] font-medium">
                    Auto
                </span>
            </button>
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
import Sudoku from "@/domain/Sudoku";
import CellHighlight from "@/domain/CellHighlight";
import Cell from "@/presentation/components/cell/Cell.vue";
import { useGameStore } from "@/stores/gameStore";
import { ROUTER_PATH } from "@/router";
import { loadGame, saveGame } from "@/application/GameStorage";
import { GameStateConverter } from "@/application/GameState";
import type { Difficulty } from "@/domain/SudokuGenerator";

const router = useRouter();
const gameStore = useGameStore();

if (!gameStore.difficulty) {
    void router.replace(ROUTER_PATH.home);
}

const { sudoku, restoredSeconds } = (() => {
    if (gameStore.continueGame) {
        const saved = loadGame();
        if (saved) {
            const raw = GameStateConverter.toSudoku(saved);
            const instance = reactive(new Sudoku());
            instance.restore(raw.answer, raw.puzzle);
            return { sudoku: instance, restoredSeconds: saved.elapsedSeconds };
        }
    }
    const instance = reactive(new Sudoku());
    instance.generate(gameStore.difficulty ?? "easy");
    return { sudoku: instance, restoredSeconds: 0 };
})();

enum InputMode { Normal, Note, Erase }

const selectedCell = ref<{ row: number; column: number } | null>(null);
const selectedDigit = ref<number | null>(null);
const completed = ref(false);
const inputMode = ref(InputMode.Normal);
const elapsedSeconds = ref(restoredSeconds);

const timerInterval = setInterval(() => {
    if (!completed.value) {
        elapsedSeconds.value++;
    }
}, 1000);

onBeforeUnmount(() => {
    clearInterval(timerInterval);
    if (!completed.value) {
        const state = GameStateConverter.fromSudoku(sudoku.raw(), {
            difficulty: gameStore.difficulty ?? "easy",
            elapsedSeconds: elapsedSeconds.value,
            completed: completed.value,
        });
        saveGame(state);
    }
});

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
    if (sudoku.isCompleted()) completed.value = true;
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
