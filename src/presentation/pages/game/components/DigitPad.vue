<template>
    <div class="flex flex-col gap-3">
        <div class="flex justify-center gap-2">
            <div
                v-for="digit in 5"
                :key="`num-${digit}`"
                class="relative"
            >
                <button
                    :class="digitButtonClasses(digit)"
                    :data-testid="`number-${digit}`"
                    :disabled="isDigitDisabled(digit)"
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
        <div class="flex justify-center gap-2">
            <div
                v-for="digit in [6, 7, 8, 9]"
                :key="`num-${digit}`"
                class="relative"
            >
                <button
                    :class="digitButtonClasses(digit)"
                    :data-testid="`number-${digit}`"
                    :disabled="isDigitDisabled(digit)"
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
            <button
                :class="eraseButtonClasses"
                :disabled="eraseDisabled"
                class="w-14 h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:cursor-default"
                data-testid="erase-button"
                @click="emit('toggleEraseMode')"
            >
                <Eraser :size="22" />
            </button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Eraser } from "lucide-vue-next";

const props = withDefaults(defineProps<{
    selectedDigit: number | null;
    eraseActive: boolean;
    digitCounts: number[];
    showRemainingCount?: boolean;
    disabledDigits?: number[];
    eraseDisabled?: boolean;
}>(), {
    showRemainingCount: true,
    disabledDigits: () => [],
    eraseDisabled: false,
});

const emit = defineEmits<{
    selectDigit: [digit: number];
    toggleEraseMode: [];
}>();

const isDigitCompleted = (digit: number): boolean => props.digitCounts[digit] >= 9;
const isDigitDisabled = (digit: number): boolean =>
    isDigitCompleted(digit) || props.disabledDigits.includes(digit);
const getRemainingCount = (digit: number): number => 9 - props.digitCounts[digit];

const digitButtonClasses = (digit: number): string => {
    if (isDigitDisabled(digit)) return "bg-card opacity-50 text-foreground-muted";
    if (props.selectedDigit === digit) return "bg-primary text-white shadow-primary-active";
    return "bg-card text-foreground shadow-card-sm hover:bg-foreground/5";
};

const eraseButtonClasses = computed(() => {
    if (props.eraseDisabled) return "bg-card opacity-50 text-foreground-muted";
    if (props.eraseActive) return "bg-primary text-white shadow-primary-active";
    return "bg-card text-foreground shadow-card-sm hover:bg-foreground/5";
});
</script>
