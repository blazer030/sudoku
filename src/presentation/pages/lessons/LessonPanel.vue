<template>
    <div
        :aria-label="t('lessons.title')"
        class="bg-card rounded-2xl shadow-card-lg w-full max-h-full px-4 pt-[var(--step-panel-top,1rem)] pb-[var(--step-panel-bottom,0.75rem)] flex flex-col gap-[var(--step-panel-gap,0.75rem)] outline-none [&>*]:shrink-0"
        data-skin="card"
        data-testid="lesson-panel"
        role="group"
    >
        <div class="flex items-center justify-between gap-2 min-h-[var(--step-panel-row,2rem)]">
            <StepTag
                :icon="tagIcon"
                :label="tagLabel"
                :step-key="stepIndex"
                :strong="stage === 'done'"
                test-id="lesson-tag"
            />
            <StepNavigator
                :next-disabled="!canGoNext"
                :step-index="stepIndex"
                :total-steps="totalSteps"
                test-id-prefix="lesson"
                @go-to="emit('goTo', $event)"
                @next="emit('next')"
                @previous="emit('previous')"
            />
        </div>

        <StepExplanation
            compact
            :step-key="messageKey"
            test-id-prefix="lesson"
        >
            <span
                v-if="messageKind === 'wrong'"
                class="inline-flex items-start gap-1.5 text-error"
                data-testid="lesson-wrong"
                role="alert"
            >
                <CircleAlert
                    :size="16"
                    class="shrink-0 mt-1"
                />
                <span>{{ messageText }}<span
                    v-if="nudgeText !== null"
                    class="ms-1 text-foreground"
                    data-testid="lesson-nudge"
                >{{ nudgeText }}</span></span>
            </span>
            <span
                v-else-if="messageKind === 'hint'"
                class="inline-flex items-start gap-1.5 text-primary"
                data-testid="lesson-hint"
            >
                <Lightbulb
                    :size="16"
                    class="shrink-0 mt-1"
                />
                <span>{{ messageText }}</span>
            </span>
            <template v-else>
                {{ messageText }}<span
                    v-if="nudgeText !== null"
                    class="ms-1"
                    data-testid="lesson-nudge"
                >{{ nudgeText }}</span>
            </template>
        </StepExplanation>

        <div class="flex gap-2.5">
            <button
                v-if="showsNoteToggle"
                v-press
                :aria-pressed="noteMode"
                :class="noteMode ? 'bg-primary-light text-primary' : 'hint-secondary'"
                class="lesson-toggle"
                data-skin="button lesson-toggle"
                data-testid="lesson-note-toggle"
                type="button"
                @click="emit('toggleNoteMode')"
            >
                {{ noteMode ? t("game.controls.notesOn") : t("game.controls.notes") }}
            </button>
            <button
                v-if="secondaryLabel !== null"
                v-press
                :data-nudge="nudge ?? undefined"
                :disabled="secondaryDisabled"
                class="hint-secondary"
                data-skin="button"
                data-testid="lesson-secondary"
                type="button"
                @click="emit('secondary')"
            >
                {{ secondaryLabel }}
            </button>
            <button
                v-press
                :disabled="primaryDisabled"
                class="hint-primary"
                data-skin="button"
                data-testid="lesson-primary"
                type="button"
                @click="emit('primary')"
            >
                {{ primaryLabel }}
            </button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { LessonStage } from "@/domain/lessons/Lesson";
import { Check, CircleAlert, Crosshair, Info, Lightbulb, PencilLine } from "@/presentation/components/icon";
import StepExplanation from "@/presentation/components/step-presentation/StepExplanation.vue";
import StepNavigator from "@/presentation/components/step-presentation/StepNavigator.vue";
import StepTag from "@/presentation/components/step-presentation/StepTag.vue";
import { vPress } from "@/presentation/directives/press";

const props = defineProps<{
    stage: LessonStage;
    stepIndex: number;
    totalSteps: number;
    canGoNext: boolean;
    /** Of a step that fills several cells. */
    progress: { done: number; total: number } | null;
    messageKind: "plain" | "hint" | "wrong";
    messageKey: string;
    messageText: string;
    showsNoteToggle: boolean;
    noteMode: boolean;
    secondaryLabel: string | null;
    secondaryDisabled: boolean;
    /** Points a stuck player to the hint button: flashing, or lit while motion is not allowed. */
    nudge: "flash" | "still" | null;
    /** Said after the message while nudging, unless a hint is showing. */
    nudgeText: string | null;
    primaryLabel: string;
    primaryDisabled: boolean;
}>();

const emit = defineEmits<{
    goTo: [index: number];
    next: [];
    previous: [];
    primary: [];
    secondary: [];
    toggleNoteMode: [];
}>();

const { t } = useI18n();

const STAGE_ICONS = { explain: Info, follow: PencilLine, alone: Crosshair, done: Check };

const tagIcon = computed(() => STAGE_ICONS[props.stage]);

const tagLabel = computed(() => {
    const stage = t(`lessons.common.stages.${props.stage}`);
    return props.progress === null ? stage : t("lessons.common.progress", { stage, ...props.progress });
});
</script>

<style scoped>
@reference "../../../style/index.css";

.hint-primary {
    @apply flex-[1.6] flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-primary text-on-primary text-[15px] font-semibold cursor-pointer shadow-primary transition-all duration-200 hover:bg-primary-hover disabled:opacity-40 disabled:cursor-default disabled:shadow-none;
}

.hint-secondary {
    @apply flex-1 py-2.5 rounded-2xl bg-foreground/5 text-foreground text-[15px] font-medium cursor-pointer transition-all duration-200 hover:bg-foreground/10 disabled:opacity-40 disabled:cursor-default;
}

.lesson-toggle {
    @apply flex-1 py-2.5 rounded-2xl text-[15px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200;
}
</style>
