<template>
    <div class="flex flex-col gap-3">
        <!-- Row 1: digits 1-5 -->
        <div class="flex justify-center gap-2">
            <div
                v-for="digit in 5"
                :key="`num-${digit}`"
                class="relative"
            >
                <button
                    :class="digitButtonClasses(digit)"
                    :data-testid="`number-${digit}`"
                    :disabled="isDigitCompleted(digit)"
                    class="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-semibold transition-all cursor-pointer disabled:cursor-default"
                    @click="emit('selectDigit', digit)"
                >
                    {{ digit }}
                </button>
                <span
                    v-if="showRemainingCount && !isDigitCompleted(digit)"
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
        <!-- Row 2: digits 6-9 + Erase -->
        <div class="flex justify-center gap-2">
            <div
                v-for="digit in 4"
                :key="`num-${digit + 5}`"
                class="relative"
            >
                <button
                    :class="digitButtonClasses(digit + 5)"
                    :data-testid="`number-${digit + 5}`"
                    :disabled="isDigitCompleted(digit + 5)"
                    class="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-semibold transition-all cursor-pointer disabled:cursor-default"
                    @click="emit('selectDigit', digit + 5)"
                >
                    {{ digit + 5 }}
                </button>
                <span
                    v-if="!isDigitCompleted(digit + 5)"
                    :class="selectedDigit === (digit + 5)
                        ? 'bg-white text-primary'
                        : 'bg-foreground-secondary text-white'"
                    :data-testid="`badge-${digit + 5}`"
                    class="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold"
                >
                    {{ getRemainingCount(digit + 5) }}
                </span>
            </div>
            <button
                :class="eraseActive
                    ? 'bg-primary text-white shadow-primary-active'
                    : 'bg-card text-foreground shadow-card-sm hover:bg-foreground/5'"
                class="w-14 h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                data-testid="erase-button"
                @click="emit('toggleEraseMode')"
            >
                <Eraser :size="22" />
            </button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { Eraser } from "lucide-vue-next";

const props = withDefaults(defineProps<{
    selectedDigit: number | null;
    eraseActive: boolean;
    digitCounts: number[];
    showRemainingCount?: boolean;
}>(), {
    showRemainingCount: true,
});

const emit = defineEmits<{
    selectDigit: [digit: number];
    toggleEraseMode: [];
}>();

const isDigitCompleted = (digit: number): boolean => props.digitCounts[digit] >= 9;
const getRemainingCount = (digit: number): number => 9 - props.digitCounts[digit];

const digitButtonClasses = (digit: number): string => {
    if (isDigitCompleted(digit)) return "bg-card opacity-50 text-foreground-muted";
    if (props.selectedDigit === digit) return "bg-primary text-white shadow-primary-active";
    return "bg-card text-foreground shadow-card-sm hover:bg-foreground/5";
};
</script>
