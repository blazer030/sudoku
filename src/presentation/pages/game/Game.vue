<template>
    <div>
        <div class="p-4 text-center">
            <span data-testid="timer">{{ formattedTime }}</span>
        </div>
        <div class="my-9">
            <div
                v-for="(row, rowIndex) in puzzle"
                :key="rowIndex"
                :class="[
                    rowIndex % 3 !== 0 ? 'border-t-2' : '',
                    rowIndex === 8 ? 'border-b-2' : '',
                    rowIndex === 0 ? 'border-t-4' : '',
                    rowIndex % 3 === 2 ? 'border-b-4' : '',
                ]"
                class="flex border-sky-200"
            >
                <Cell
                    v-for="(puzzleCell, columnIndex) in row"
                    :key="`cell-${rowIndex}-${columnIndex}`"
                    :class="[
                        columnIndex % 3 !== 0 ? 'border-l-2' : '',
                        columnIndex === 8 ? 'border-r-2' : '',
                        columnIndex === 0 ? 'border-l-4' : '',
                        columnIndex % 3 === 2 ? 'border-r-4' : '',
                    ]"
                    :data-testid="`cell-${rowIndex}-${columnIndex}`"
                    :highlight="getCellHighlight(rowIndex, columnIndex)"
                    :puzzle-cell="puzzleCell"
                    :selected="isSelected(rowIndex, columnIndex)"
                    class="border-sky-200"
                    @click="clickCell(rowIndex, columnIndex)"
                />
            </div>
        </div>
        <div
            v-if="completed"
            class="text-center text-2xl font-bold text-green-600 my-4"
        >
            Completed
        </div>
        <div class="flex justify-center px-4 gap-2 mb-4">
            <Button
                data-testid="undo-button"
                variant="outline"
                @click="sudoku.undo()"
            >
                Undo
            </Button>
            <Button
                :selected="inputMode === InputMode.Erase"
                data-testid="erase-button"
                variant="outline"
                @click="toggleEraseMode"
            >
                Erase
            </Button>
            <Button
                :selected="inputMode === InputMode.Note"
                data-testid="note-button"
                variant="outline"
                @click="toggleNoteMode"
            >
                Note
            </Button>
            <Button
                data-testid="auto-notes-button"
                variant="outline"
                @click="sudoku.autoNotes()"
            >
                Auto
            </Button>
        </div>
        <div class="flex px-4 gap-2">
            <div
                v-for="number in 9"
                :key="`num-${number}`"
                class="flex-1 aspect-square"
            >
                <Button
                    :data-testid="`number-${number}`"
                    :disabled="isNumberCompleted(number)"
                    :selected="selectedNumber === number"
                    class="w-full h-full text-2xl rounded-full"
                    variant="outline"
                    @click="inputNumber(number)"
                >
                    {{ number }}
                </Button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import Sudoku from "@/domain/Sudoku";
import CellHighlight from "@/domain/CellHighlight";
import Button from "@/presentation/components/ui/button/Button.vue";
import Cell from "@/presentation/components/cell/Cell.vue";
import { useGameStore } from "@/stores/gameStore";
import { ROUTER_PATH } from "@/router";
import { saveGame } from "@/application/GameStorage";
import { GameStateConverter } from "@/application/GameState";

const router = useRouter();
const gameStore = useGameStore();

if (!gameStore.difficulty) {
    void router.replace(ROUTER_PATH.home);
}

const sudoku = reactive(new Sudoku());
const puzzle = gameStore.difficulty ? sudoku.generate(gameStore.difficulty) : sudoku.generate("easy");

enum InputMode { Normal, Note, Erase }

const selectedCell = ref<{ row: number; column: number } | null>(null);
const selectedNumber = ref<number | null>(null);
const completed = ref(false);
const inputMode = ref(InputMode.Normal);
const elapsedSeconds = ref(0);

const timerInterval = setInterval(() => {
    if (!completed.value) {
        elapsedSeconds.value++;
    }
}, 1000);

onBeforeUnmount(() => {
    clearInterval(timerInterval);
    if (!completed.value) {
        const state = GameStateConverter.fromSudoku(sudoku, {
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
    if (puzzle[row][column].isClue) return;
    if (puzzle[row][column].input === value) {
        sudoku.input(row, column, 0);
        return;
    }
    sudoku.input(row, column, value);
    if (sudoku.isCompleted()) completed.value = true;
    if (isNumberCompleted(value)) selectedNumber.value = null;
}

function toggleSelectCell(row: number, column: number) {
    if (puzzle[row][column].isClue) return;
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

function getCellHighlight(row: number, column: number): CellHighlight {
    const cell = puzzle[row][column];
    const cellValue = cell.isClue ? cell.value : cell.input;
    if (selectedNumber.value && cellValue === selectedNumber.value) return CellHighlight.SameNumber;

    if (!selectedCell.value) return CellHighlight.None;
    const selectedRow = selectedCell.value.row;
    const selectedColumn = selectedCell.value.column;
    if (row === selectedRow && column === selectedColumn) return CellHighlight.None;
    if (row === selectedRow || column === selectedColumn) return CellHighlight.Peer;
    const sameBox = Math.floor(row / 3) === Math.floor(selectedRow / 3)
        && Math.floor(column / 3) === Math.floor(selectedColumn / 3);
    if (sameBox) return CellHighlight.Peer;
    return CellHighlight.None;
}

function isNumberCompleted(value: number): boolean {
    let count = 0;
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = puzzle[row][col];
            if (cell.value === value || cell.input === value) count++;
        }
    }
    return count >= 9;
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
</script>
