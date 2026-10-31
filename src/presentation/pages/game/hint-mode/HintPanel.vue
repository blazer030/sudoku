<template>
    <div
        ref="panel"
        :aria-label="t('hintMode.badge')"
        :style="maxHeight === null ? undefined : { maxHeight: `${maxHeight}px` }"
        class="bg-card rounded-2xl shadow-card-lg w-full p-4 pb-3 flex flex-col gap-3 outline-none [&>*]:shrink-0"
        data-skin="card"
        data-testid="hint-panel"
        role="group"
        tabindex="-1"
    >
        <template v-if="phase === 'wrongEntry' && wrongCell">
            <div class="flex items-center gap-2.5">
                <span
                    class="w-8 h-8 rounded-full bg-error-surface flex items-center justify-center shrink-0"
                    data-skin="icon-tile danger"
                >
                    <CircleAlert
                        :size="18"
                        class="text-error"
                    />
                </span>
                <!-- Shown with its content in place, so only an alert is sure to be read out. -->
                <span
                    class="text-foreground text-[15px] font-semibold"
                    data-testid="hint-wrong-entry"
                    role="alert"
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
                    v-press
                    data-skin="button"
                    class="hint-secondary"
                    data-testid="hint-close"
                    @click="emit('close')"
                >
                    {{ t("hintMode.panel.close") }}
                </button>
                <button
                    v-press
                    data-skin="button"
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
                <StepTag
                    :icon="isLastStep ? PencilLine : ListFilter"
                    :label="techniqueLabel(step.step.technique)"
                    :step-key="stepIndex"
                    :strong="isLastStep"
                    test-id="hint-technique"
                />
                <StepNavigator
                    :step-index="stepIndex"
                    :total-steps="totalSteps"
                    test-id-prefix="hint"
                    @go-to="emit('goTo', $event)"
                    @next="emit('next')"
                    @previous="emit('previous')"
                />
            </div>

            <StepExplanation
                ref="explanation"
                :step-key="stepIndex"
                test-id-prefix="hint"
            >
                {{ explanation }}
            </StepExplanation>

            <div class="flex gap-2.5">
                <button
                    v-press
                    data-skin="button"
                    class="hint-secondary"
                    data-testid="hint-close"
                    @click="emit('close')"
                >
                    {{ t("hintMode.panel.close") }}
                </button>
                <button
                    v-press
                    data-skin="button"
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
                            <span class="w-6 h-6 rounded-md bg-on-primary/10 flex items-center justify-center text-[15px] font-semibold leading-none">{{ digit }}</span>
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
import { computed, nextTick, onMounted, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ChevronRight, CircleAlert, Eraser, EyeOff, ListFilter, PencilLine } from "lucide-vue-next";
import type { RevealHintStep } from "@/domain/game/RevealHint";
import type { CellReference } from "@/domain/solver/SolveStep";
import type { HintPhase } from "@/presentation/pages/game/hint-mode/useHintMode";
import { useHintExplanation } from "@/presentation/components/step-presentation/useHintExplanation";
import { useTechniqueLabel } from "@/presentation/i18n/techniqueLabels";
import StepTag from "@/presentation/components/step-presentation/StepTag.vue";
import StepNavigator from "@/presentation/components/step-presentation/StepNavigator.vue";
import StepExplanation from "@/presentation/components/step-presentation/StepExplanation.vue";
import { vPress } from "@/presentation/directives/press";

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

// The controls underneath turn inert while the panel is open, so take keyboard focus with it.
const panel = useTemplateRef<HTMLElement>("panel");
const explanationRegion = useTemplateRef<InstanceType<typeof StepExplanation>>("explanation");

onMounted(() => {
    panel.value?.focus({ preventScroll: true });
});
// A new height cap can clip the explanation, or stop clipping it.
watch(() => props.maxHeight, () => { void nextTick(() => { explanationRegion.value?.updateClipped(); }); });
</script>

<style scoped>
@reference "../../../../style/index.css";

.hint-primary {
    @apply flex-[1.6] flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-primary text-on-primary text-[15px] font-semibold cursor-pointer shadow-primary transition-all duration-200 hover:bg-primary-hover;
}

.hint-secondary {
    @apply flex-1 py-2.5 rounded-2xl bg-foreground/5 text-foreground text-[15px] font-medium cursor-pointer transition-all duration-200 hover:bg-foreground/10;
}
</style>
