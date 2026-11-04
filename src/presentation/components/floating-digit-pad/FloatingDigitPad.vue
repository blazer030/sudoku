<template>
    <div
        ref="pad"
        :class="{ 'floating-pad-enter': motionAllowed() }"
        :data-note-mode="noteMode"
        :style="placementStyle"
        class="floating-pad absolute z-30 grid gap-0.5 p-0.5 bg-card border border-primary rounded-xl shadow-popup"
        data-skin="card floating-pad"
        data-testid="floating-digit-pad"
        role="group"
    >
        <button
            v-for="digit in BOARD_SIZE"
            :key="digit"
            v-press:bounce
            :aria-label="digitLabel(digit)"
            :aria-pressed="isMarked(digit)"
            :class="[
                isMarked(digit) ? 'bg-primary text-on-primary' : 'bg-background text-foreground',
                noteMode ? 'text-[length:calc(var(--text-sm)*var(--key-scale,1))]' : 'text-[length:calc(var(--text-xl)*var(--key-scale,1))]',
            ]"
            :data-testid="`floating-number-${digit}`"
            :disabled="isDigitDisabled(digit)"
            class="flex items-center justify-center min-w-0 min-h-0 rounded-lg font-key font-semibold leading-none cursor-pointer disabled:opacity-40 disabled:cursor-default"
            data-skin="key floating-key"
            type="button"
            @click="emit('selectDigit', digit)"
        >
            <span>{{ digit }}</span>
        </button>
        <button
            v-press
            :aria-label="t('game.controls.erase')"
            :disabled="eraseDisabled"
            class="col-span-3 flex items-center justify-center gap-1 min-h-0 rounded-lg bg-background text-foreground text-[11px] font-medium leading-none cursor-pointer disabled:opacity-40 disabled:cursor-default"
            data-skin="key floating-erase"
            data-testid="floating-erase"
            type="button"
            @click="emit('erase')"
        >
            <Eraser :size="14" />
            <span>{{ t("game.controls.erase") }}</span>
        </button>
    </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watchPostEffect } from "vue";
import { useI18n } from "vue-i18n";
import { BOARD_SIZE } from "@/domain/board/constants";
import { Eraser } from "@/presentation/components/icon";
import { floatingPadPlacement, floatingPadSize } from "@/presentation/components/floating-digit-pad/floatingPadPlacement";
import { useMotionAllowed } from "@/presentation/composables/useMotionAllowed";
import { vPress } from "@/presentation/directives/press";

const props = withDefaults(defineProps<{
    cell: { row: number; column: number };
    digitCounts: number[];
    noteMode?: boolean;
    /** The digit the cell holds, 0 for none. */
    currentEntry?: number;
    currentNotes?: number[];
    disabledDigits?: number[];
    eraseDisabled?: boolean;
}>(), {
    noteMode: false,
    currentEntry: 0,
    currentNotes: () => [],
    disabledDigits: () => [],
    eraseDisabled: false,
});

const emit = defineEmits<{
    selectDigit: [digit: number];
    erase: [];
}>();

const { t } = useI18n();
const motionAllowed = useMotionAllowed();

const asBoardShare = (cells: number): string => `${(cells / BOARD_SIZE) * 100}%`;

// The board it sits on sets the cell size, and so how far past three cells the pad must grow
const pad = useTemplateRef<HTMLElement>("pad");
const cellSize = ref(0);
const measureCell = () => {
    cellSize.value = (pad.value?.parentElement?.clientWidth ?? 0) / BOARD_SIZE;
};
onMounted(() => {
    measureCell();
    window.addEventListener("resize", measureCell);
});
onBeforeUnmount(() => {
    window.removeEventListener("resize", measureCell);
});

const size = computed(() => floatingPadSize(cellSize.value));
const placement = computed(() => floatingPadPlacement(props.cell, size.value));

const placementStyle = computed(() => ({
    top: asBoardShare(placement.value.rowStart),
    left: asBoardShare(placement.value.columnStart),
    width: asBoardShare(size.value.columns),
    height: asBoardShare(size.value.rows),
}));

const runsPastBoard = computed(() => {
    const { rowStart, columnStart } = placement.value;
    return rowStart < 0 || columnStart < 0
        || rowStart + size.value.rows > BOARD_SIZE
        || columnStart + size.value.columns > BOARD_SIZE;
});

// A skin that clips its board lifts the clip through this mark, so the pad's overhang shows and takes taps.
// The pad marks the board itself: both pages get it, and the board's own attributes stay as they are.
const boardElement = (): Element | null => pad.value?.closest("[data-skin~='board']") ?? null;
watchPostEffect(() => {
    boardElement()?.toggleAttribute("data-floating-pad-past", runsPastBoard.value);
});
onBeforeUnmount(() => {
    boardElement()?.removeAttribute("data-floating-pad-past");
});

const isMarked = (digit: number): boolean =>
    props.noteMode ? props.currentNotes.includes(digit) : props.currentEntry === digit;

const isDigitDisabled = (digit: number): boolean =>
    props.digitCounts[digit] >= BOARD_SIZE || props.disabledDigits.includes(digit);

const digitLabel = (digit: number): string =>
    t(props.noteMode ? "game.digitPad.note" : "game.digitPad.fill", { digit, count: BOARD_SIZE - props.digitCounts[digit] });
</script>

<style scoped>
.floating-pad {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(3, minmax(0, 1fr)) minmax(0, 0.6fr);
}

.floating-pad-enter {
    animation: floating-pad-enter 140ms ease-out;
}

@keyframes floating-pad-enter {
    from {
        opacity: 0;
        transform: scale(0.92);
    }
}
</style>
