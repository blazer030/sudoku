<template>
    <div
        :style="maxHeight === null ? undefined : { maxHeight: `${maxHeight}px` }"
        class="bg-card rounded-2xl shadow-card-lg w-full p-4 pb-3 flex flex-col gap-3 [&>*]:shrink-0"
        data-testid="hint-panel"
    >
        <template v-if="phase === 'wrongEntry' && wrongCell">
            <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-full bg-error-light flex items-center justify-center shrink-0">
                    <CircleAlert
                        :size="18"
                        class="text-error"
                    />
                </span>
                <span
                    class="text-foreground text-[15px] font-semibold"
                    data-testid="hint-wrong-entry"
                >
                    {{ t("hintMode.panel.wrongEntry", { cell: cellName(wrongCell) }) }}
                </span>
            </div>
            <p
                class="text-foreground-secondary text-sm leading-relaxed"
                data-testid="hint-wrong-entry-note"
            >
                {{ t("hintMode.panel.wrongEntryNote") }}
            </p>
            <div class="flex gap-2.5 pt-1">
                <button
                    class="hint-secondary"
                    data-testid="hint-close"
                    @click="emit('close')"
                >
                    {{ t("hintMode.panel.close") }}
                </button>
                <button
                    class="hint-primary"
                    data-testid="hint-clear"
                    @click="emit('clear')"
                >
                    <Eraser :size="18" />
                    {{ t("hintMode.panel.clear") }}
                </button>
            </div>
        </template>

        <template v-else-if="phase === 'steps' && step">
            <div class="flex items-center justify-between gap-2">
                <Transition
                    mode="out-in"
                    name="hint-step"
                >
                    <span
                        :key="`technique-${stepIndex}`"
                        :class="isLastStep ? 'bg-primary text-white' : 'bg-primary-light text-primary'"
                        class="inline-flex items-center gap-1.5 rounded-full text-[13px] font-semibold pl-2 pr-2.5 py-1 leading-none whitespace-nowrap"
                        data-testid="hint-technique"
                    >
                        <component
                            :is="isLastStep ? PencilLine : ListFilter"
                            :size="14"
                        />
                        {{ techniqueLabel(step.step.technique) }}
                    </span>
                </Transition>
                <div class="flex items-center gap-1 shrink-0">
                    <button
                        :aria-label="t('hintMode.panel.previousStep')"
                        :disabled="stepIndex === 0"
                        class="hint-arrow"
                        data-testid="hint-previous"
                        @click="emit('previous')"
                    >
                        <ChevronLeft :size="20" />
                    </button>
                    <span
                        v-if="totalSteps > MAX_STEP_DOTS"
                        class="min-w-11 text-center text-[13px] font-semibold tabular-nums text-foreground-secondary"
                        data-testid="hint-step-counter"
                    >
                        {{ stepIndex + 1 }} / {{ totalSteps }}
                    </span>
                    <div
                        v-else
                        class="flex items-center gap-1 px-0.5"
                    >
                        <button
                            v-for="index in totalSteps"
                            :key="`dot-${index}`"
                            :aria-current="index - 1 === stepIndex ? 'step' : undefined"
                            :aria-label="t('hintMode.panel.stepCounter', { current: index, total: totalSteps })"
                            :class="dotClass(index - 1)"
                            :data-testid="`hint-dot-${index - 1}`"
                            class="h-2 rounded-full transition-all duration-300 cursor-pointer"
                            @click="emit('goTo', index - 1)"
                        />
                    </div>
                    <button
                        :aria-label="t('hintMode.panel.nextStep')"
                        :disabled="isLastStep"
                        class="hint-arrow"
                        data-testid="hint-next"
                        @click="emit('next')"
                    >
                        <ChevronRight :size="20" />
                    </button>
                </div>
            </div>

            <!-- The only part that gives way when a long explanation would push the buttons off screen. -->
            <div
                ref="explanationBox"
                :class="explanationClipped ? 'hint-explanation-fade' : ''"
                class="hint-explanation-box min-h-[4.6rem] shrink! overflow-y-auto"
                @scroll="updateExplanationClipped"
            >
                <Transition
                    mode="out-in"
                    name="hint-step"
                    @before-enter="scrollExplanationToTop"
                    @after-enter="updateExplanationClipped"
                >
                    <p
                        :key="`explanation-${stepIndex}`"
                        class="text-foreground text-[14.5px] leading-[1.6]"
                        aria-live="polite"
                        data-testid="hint-explanation"
                    >
                        {{ explanation }}
                    </p>
                </Transition>
            </div>

            <div class="flex gap-2.5">
                <button
                    class="hint-secondary"
                    data-testid="hint-cancel"
                    @click="emit('cancel')"
                >
                    {{ t("common.cancel") }}
                </button>
                <button
                    class="hint-primary"
                    data-testid="hint-primary"
                    @click="isLastStep ? emit('fill') : emit('next')"
                >
                    <i18n-t
                        v-if="isLastStep && digit !== null"
                        class="flex items-center gap-2"
                        keypath="hintMode.panel.fill"
                        scope="global"
                        tag="span"
                    >
                        <template #digit>
                            <span class="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-[15px] font-semibold leading-none">{{ digit }}</span>
                        </template>
                    </i18n-t>
                    <template v-else>
                        {{ t("hintMode.panel.next") }}
                        <ChevronRight :size="18" />
                    </template>
                </button>
            </div>

            <p
                class="flex items-center justify-center gap-1.5 text-foreground-muted text-[11px] leading-snug text-center"
                data-testid="hint-caption"
            >
                <EyeOff
                    :size="12"
                    class="shrink-0"
                />
                {{ t("hintMode.panel.notesHidden") }}
            </p>
        </template>
    </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ChevronLeft, ChevronRight, CircleAlert, Eraser, EyeOff, ListFilter, PencilLine } from "lucide-vue-next";
import type { RevealHintStep } from "@/domain/game/RevealHint";
import type { CellReference } from "@/domain/solver/SolveStep";
import type { HintPhase } from "@/presentation/pages/game/hint-mode/useHintMode";
import { useHintExplanation } from "@/presentation/pages/game/hint-mode/useHintExplanation";
import { useTechniqueLabel } from "@/presentation/labels/techniqueLabels";

const props = withDefaults(defineProps<{
    phase: HintPhase | null;
    wrongCell: CellReference | null;
    step: RevealHintStep | null;
    stepIndex: number;
    totalSteps: number;
    isLastStep: boolean;
    digit: number | null;
    maxHeight?: number | null;
}>(), { maxHeight: null });

const emit = defineEmits<{
    close: [];
    clear: [];
    cancel: [];
    previous: [];
    next: [];
    goTo: [index: number];
    fill: [];
}>();

const { t } = useI18n();
const techniqueLabel = useTechniqueLabel();
const explain = useHintExplanation();

const cellName = (cell: CellReference): string =>
    t("hintMode.place.cell", { row: cell.row + 1, column: cell.column + 1 });

const explanation = computed(() =>
    props.step === null ? "" : explain(props.step.step, props.step.candidatesBefore));

// When the panel is height-capped, fade the cut-off edge so a long explanation reads as scrollable.
const explanationBox = useTemplateRef<HTMLElement>("explanationBox");
const explanationClipped = ref(false);

const updateExplanationClipped = () => {
    const box = explanationBox.value;
    if (box === null) return;
    explanationClipped.value = box.scrollTop + box.clientHeight < box.scrollHeight - 1;
};

const scrollExplanationToTop = () => {
    if (explanationBox.value !== null) explanationBox.value.scrollTop = 0;
};

onMounted(updateExplanationClipped);
watch(() => [props.maxHeight, explanation.value], () => { void nextTick(updateExplanationClipped); });

// Beyond this many steps the dots, the arrows and the longest technique name no longer fit
// one row of a 360px-wide panel, so a "3 / 8" counter takes the dots' place.
const MAX_STEP_DOTS = 6;

const dotClass = (index: number): string => {
    if (index === props.stepIndex) return "w-5 bg-primary";
    if (index < props.stepIndex) return "w-2 bg-primary/40";
    return "w-2 bg-border";
};
</script>

<style scoped>
@reference "../../../../style/index.css";

/* Short screens let the explanation shrink to one line, so the buttons and the caption stay on screen. */
@media (max-height: 700px) {
    .hint-explanation-box {
        min-height: 1.45rem;
    }
}

.hint-primary {
    @apply flex-[1.6] flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-primary text-white text-[15px] font-semibold cursor-pointer shadow-primary transition-all duration-200 hover:bg-primary-hover active:scale-[0.98];
}

.hint-secondary {
    @apply flex-1 py-2.5 rounded-2xl bg-foreground/5 text-foreground text-[15px] font-medium cursor-pointer transition-all duration-200 hover:bg-foreground/10 active:scale-[0.98];
}

.hint-arrow {
    @apply w-8 h-8 rounded-full flex items-center justify-center text-foreground cursor-pointer transition-all duration-200 hover:bg-foreground/5 disabled:opacity-25 disabled:cursor-default;
}

.hint-explanation-fade {
    mask-image: linear-gradient(to bottom, #000 calc(100% - 1.5rem), transparent);
}

.hint-step-enter-active,
.hint-step-leave-active {
    transition: opacity 160ms ease, transform 160ms ease;
}

.hint-step-enter-from {
    opacity: 0;
    transform: translateY(4px);
}

.hint-step-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
