<template>
    <div
        class="flex flex-col gap-(--digit-key-row-gap)"
        data-testid="digit-pad"
    >
        <!-- Each row is five square keys of at most --digit-key-size; in a window narrower than
             the row they shrink together instead of the outer keys being cut off -->
        <div
            class="grid grid-cols-[repeat(5,minmax(0,var(--digit-key-size)))] justify-center gap-2"
            data-testid="digit-key-row"
        >
            <div
                v-for="digit in 5"
                :key="`num-${digit}`"
                class="relative"
            >
                <button
                    v-press:bounce
                    data-skin="key"
                    :aria-label="digitLabel(digit)"
                    :aria-pressed="selectedDigit === digit"
                    :class="[digitButtonClasses(digit), digitSizeClasses]"
                    :data-testid="`number-${digit}`"
                    :disabled="isDigitDisabled(digit)"
                    class="@container w-full aspect-square rounded-xl flex items-center justify-center font-key font-semibold leading-none transition-all cursor-pointer disabled:cursor-default"
                    @click="emit('selectDigit', digit)"
                >
                    <span
                        :data-testid="`number-${digit}-glyph`"
                        :style="glyphStyle(digit)"
                        class="inline-block transition-transform duration-300 ease-out motion-reduce:transition-none"
                    >{{ digit }}</span>
                </button>
                <span
                    v-if="showRemainingCount && !isDigitCompleted(digit)"
                    data-skin="badge"
                    :class="[
                        selectedDigit === digit ? 'bg-on-primary text-primary' : 'bg-foreground-secondary text-card',
                        { 'opacity-0': noteMode },
                    ]"
                    :data-testid="`badge-${digit}`"
                    class="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold transition-opacity duration-200"
                >
                    {{ getRemainingCount(digit) }}
                </span>
            </div>
        </div>
        <div
            class="grid grid-cols-[repeat(5,minmax(0,var(--digit-key-size)))] justify-center gap-2"
            data-testid="digit-key-row"
        >
            <div
                v-for="digit in [6, 7, 8, 9]"
                :key="`num-${digit}`"
                class="relative"
            >
                <button
                    v-press:bounce
                    data-skin="key"
                    :aria-label="digitLabel(digit)"
                    :aria-pressed="selectedDigit === digit"
                    :class="[digitButtonClasses(digit), digitSizeClasses]"
                    :data-testid="`number-${digit}`"
                    :disabled="isDigitDisabled(digit)"
                    class="@container w-full aspect-square rounded-xl flex items-center justify-center font-key font-semibold leading-none transition-all cursor-pointer disabled:cursor-default"
                    @click="emit('selectDigit', digit)"
                >
                    <span
                        :data-testid="`number-${digit}-glyph`"
                        :style="glyphStyle(digit)"
                        class="inline-block transition-transform duration-300 ease-out motion-reduce:transition-none"
                    >{{ digit }}</span>
                </button>
                <span
                    v-if="showRemainingCount && !isDigitCompleted(digit)"
                    data-skin="badge"
                    :class="[
                        selectedDigit === digit ? 'bg-on-primary text-primary' : 'bg-foreground-secondary text-card',
                        { 'opacity-0': noteMode },
                    ]"
                    :data-testid="`badge-${digit}`"
                    class="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold transition-opacity duration-200"
                >
                    {{ getRemainingCount(digit) }}
                </span>
            </div>
            <button
                v-press:bounce
                data-skin="key"
                :aria-label="t('game.controls.erase')"
                :aria-pressed="eraseActive"
                :class="eraseButtonClasses"
                :disabled="eraseDisabled"
                class="w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer disabled:cursor-default"
                data-testid="erase-button"
                @click="emit('toggleEraseMode')"
            >
                <Eraser :size="20" />
                <span class="text-[10px] font-medium leading-none">{{ t("game.controls.erase") }}</span>
            </button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { noteGlyphStyle } from "@/presentation/components/digit-pad/noteGlyphPlace";
import { Eraser } from "@/presentation/components/icon";
import { vPress } from "@/presentation/directives/press";

const props = withDefaults(defineProps<{
    selectedDigit: number | null;
    eraseActive: boolean;
    digitCounts: number[];
    showRemainingCount?: boolean;
    disabledDigits?: number[];
    eraseDisabled?: boolean;
    /** Digits go into notes, so the keys show smaller digits, each at its place in a cell's note grid. */
    noteMode?: boolean;
}>(), {
    showRemainingCount: true,
    disabledDigits: () => [],
    eraseDisabled: false,
    noteMode: false,
});

const emit = defineEmits<{
    selectDigit: [digit: number];
    toggleEraseMode: [];
}>();

const { t } = useI18n();

const isDigitCompleted = (digit: number): boolean => props.digitCounts[digit] >= 9;
const isDigitDisabled = (digit: number): boolean =>
    isDigitCompleted(digit) || props.disabledDigits.includes(digit);
const getRemainingCount = (digit: number): number => 9 - props.digitCounts[digit];

const digitLabel = (digit: number): string =>
    t(props.noteMode ? "game.digitPad.note" : "game.digitPad.fill", { digit, count: getRemainingCount(digit) });

// Sizes go through --key-scale, which a style may raise for a narrower face; it defaults to 1.
// The line box is the glyph's, so a larger face cannot push the digit.
const digitSizeClasses = computed(() => (props.noteMode
    ? "text-[length:calc(var(--digit-key-note-text)*var(--key-scale,1))]"
    : "text-[length:calc(var(--digit-key-text)*var(--key-scale,1))]"));

// In note mode each digit moves to its note place, and the remaining counts fade so they do not cover the
// corner digits; the keys still speak them.
const glyphStyle = (digit: number) => noteGlyphStyle(digit, props.noteMode);

const digitButtonClasses = (digit: number): string => {
    if (isDigitDisabled(digit)) return "bg-card opacity-50 text-foreground-muted";
    if (props.selectedDigit === digit) return "bg-primary text-on-primary shadow-primary-active";
    return "bg-card text-foreground shadow-card-sm hover:bg-foreground/5";
};

const eraseButtonClasses = computed(() => {
    if (props.eraseDisabled) return "bg-card opacity-50 text-foreground-muted";
    if (props.eraseActive) return "bg-primary text-on-primary shadow-primary-active";
    return "bg-card text-foreground shadow-card-sm hover:bg-foreground/5";
});
</script>
