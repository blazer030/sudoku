<template>
    <div class="flex flex-col gap-6 pt-6 pb-5 px-5">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <button
                class="flex items-center gap-2 cursor-pointer"
                @click="goBack"
            >
                <ChevronLeft
                    :size="24"
                    class="text-foreground"
                />
                <span class="text-foreground text-base font-medium">
                    Back
                </span>
            </button>
            <div class="flex items-center gap-1.5">
                <Timer
                    :size="18"
                    class="text-foreground-secondary"
                />
                <span
                    class="text-foreground text-lg font-semibold"
                    data-testid="timer"
                >
                    {{ formattedTime }}
                </span>
            </div>
            <div class="flex items-center bg-primary-light rounded-full px-3 py-1.5">
                <span class="text-primary text-xs font-semibold leading-none">
                    {{ difficultyLabel }}
                </span>
            </div>
        </div>

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
                        :puzzle-cell="puzzleCell"
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

        <!-- Number Pad -->
        <div class="flex gap-1.5">
            <div
                v-for="number in 9"
                :key="`num-${number}`"
                class="relative flex-1 min-w-0"
            >
                <button
                    :class="numberButtonClasses(number)"
                    :data-testid="`number-${number}`"
                    :disabled="isNumberCompleted(number)"
                    class="w-full h-12 rounded-xl flex items-center justify-center text-2xl font-semibold transition-all cursor-pointer disabled:cursor-default"
                    @click="inputNumber(number)"
                >
                    {{ number }}
                </button>
                <span
                    v-if="!isNumberCompleted(number)"
                    :class="selectedNumber === number
                        ? 'bg-white text-primary'
                        : 'bg-foreground-secondary text-white'"
                    :data-testid="`badge-${number}`"
                    class="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold"
                >
                    {{ getRemainingCount(number) }}
                </span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ChevronLeft, Eraser, Pencil, Sparkles, Timer, Undo2 } from "lucide-vue-next";
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
const selectedNumber = ref<number | null>(null);
const completed = ref(false);
const inputMode = ref(InputMode.Normal);
const elapsedSeconds = ref(restoredSeconds);

const difficultyLabels: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };
const difficultyLabel = difficultyLabels[gameStore.difficulty ?? "easy"];

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

const formattedTime = computed(() => {
    const minutes = Math.floor(elapsedSeconds.value / 60);
    const seconds = elapsedSeconds.value % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});

function goBack() {
    void router.push(ROUTER_PATH.home);
}

function clickCell(row: number, column: number) {
    if (inputMode.value === InputMode.Erase) {
        eraseCell(row, column);
        return;
    }
    if (selectedNumber.value !== null) {
        if (inputMode.value === InputMode.Note) {
            noteToCell(row, column, selectedNumber.value);
        } else {
            inputToCell(row, column, selectedNumber.value);
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
    if (sudoku.puzzle[row][column].input === value) {
        sudoku.input(row, column, 0);
        return;
    }
    sudoku.input(row, column, value);
    if (sudoku.isCompleted()) completed.value = true;
    if (isNumberCompleted(value)) selectedNumber.value = null;
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
            const cellValue = cell.isClue ? cell.value : cell.input;
            if (selectedNumber.value && cellValue === selectedNumber.value) {
                grid[row][column] = CellHighlight.SameNumber;
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

const numberCounts = computed(() => {
    const counts = Array.from<number>({ length: 10 }, () => 0);
    for (let row = 0; row < 9; row++) {
        for (let column = 0; column < 9; column++) {
            const cell = sudoku.puzzle[row][column];
            // 明確存取兩個屬性，確保 Vue 追蹤 _value 和 _input
            const v = cell.value;
            const i = cell.input;
            if (v > 0) counts[v]++;
            else if (i > 0) counts[i]++;
        }
    }
    return counts;
});

function isNumberCompleted(value: number): boolean {
    return numberCounts.value[value] >= 9;
}

function getRemainingCount(value: number): number {
    return 9 - numberCounts.value[value];
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
        selectedNumber.value = null;
    }
}

function inputNumber(value: number) {
    if (inputMode.value === InputMode.Erase) inputMode.value = InputMode.Normal;
    if (selectedCell.value) {
        const { row, column } = selectedCell.value;
        if (inputMode.value === InputMode.Note) {
            sudoku.toggleNote(row, column, value);
            return;
        }
        inputToCell(row, column, value);
        return;
    }
    selectedNumber.value = selectedNumber.value === value ? null : value;
}

function numberButtonClasses(number: number): string {
    if (isNumberCompleted(number)) return "bg-card opacity-50 text-foreground-muted";
    if (selectedNumber.value === number) return "bg-primary text-white shadow-[0_2px_8px_#3D8A5A40]";
    return "bg-card text-foreground shadow-[0_1px_4px_#1A191808]";
}
</script>
