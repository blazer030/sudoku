<template>
    <div
        :data-selected-cell="selectedCellName"
        class="bg-card rounded-2xl shadow-card-lg p-2 self-center w-[calc(100%+1.5rem)] max-w-board-fit"
        data-skin="board"
    >
        <slot name="before-grid" />
        <div
            ref="grid"
            :class="{ relative: $slots.default !== undefined, 'has-step-links': hasStepLinks }"
            class="flex flex-col border-3 border-foreground/20 rounded-xl"
            data-skin="board-grid"
        >
            <div
                v-for="(row, rowIndex) in cells"
                :key="rowIndex"
                :data-testid="rowTestIdPrefix === undefined ? undefined : `${rowTestIdPrefix}${rowIndex}`"
                class="grid grid-cols-9"
            >
                <template
                    v-for="(cell, columnIndex) in row"
                    :key="columnIndex"
                >
                    <slot
                        :cell="cell"
                        :column="columnIndex"
                        name="cell"
                        :row="rowIndex"
                    />
                </template>
            </div>
            <slot />
        </div>
    </div>
</template>

<script lang="ts" setup generic="CellData">
import { computed, useTemplateRef } from "vue";
import { cellName } from "@/presentation/components/board-cell/cellName";
import type { CellReference } from "@/domain/solver/SolveStep";

/**
 * The board every page shows (game, Game Review, Walkthrough, lessons): the `board` card a style's frame
 * wraps, its `board-grid` and the nine rows, each cell drawn by the page through the `cell` slot. The default
 * slot is laid over the grid (overlays, the floating pad), which is then positioned for it.
 */
const props = defineProps<{
    cells: readonly (readonly CellData[])[];
    // The cell the skin may point at, carried as data-selected-cell
    selectedCell?: CellReference | null;
    hasStepLinks?: boolean;
    rowTestIdPrefix?: string;
}>();

defineSlots<{
    "before-grid"?: () => unknown;
    cell: (props: { cell: CellData; row: number; column: number }) => unknown;
    default?: () => unknown;
}>();

const selectedCellName = computed(() => props.selectedCell ? cellName(props.selectedCell.row, props.selectedCell.column) : undefined);

const grid = useTemplateRef<HTMLElement>("grid");

/** The element of the cell at row and column, for a page that scrolls it into view. */
const cellElement = (row: number, column: number): HTMLElement | null => {
    const element = grid.value?.children[row]?.children[column];
    return element instanceof HTMLElement ? element : null;
};

defineExpose({ cellElement });
</script>
