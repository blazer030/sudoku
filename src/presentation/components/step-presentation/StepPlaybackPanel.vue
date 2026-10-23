<template>
    <div
        :aria-label="label"
        :data-testid="`${testIdPrefix}-panel`"
        :style="maxHeight === null ? undefined : { maxHeight: `${maxHeight}px` }"
        class="bg-card rounded-2xl shadow-card-lg w-full p-4 pb-3 flex flex-col gap-3 outline-none [&>*]:shrink-0"
        data-skin="card"
        role="group"
    >
        <div class="flex items-center justify-between gap-2 min-h-8">
            <slot name="tag" />
            <StepNavigator
                :step-index="stepIndex"
                :test-id-prefix="testIdPrefix"
                :total-steps="totalSteps"
                class="ml-auto"
                @go-to="emit('goTo', $event)"
                @next="emit('next')"
                @previous="emit('previous')"
            />
        </div>

        <StepExplanation
            ref="explanation"
            :compact="compactExplanation"
            :step-key="stepIndex"
            :test-id-prefix="testIdPrefix"
        >
            <slot />
        </StepExplanation>

        <div class="flex items-center gap-3">
            <button
                v-press
                data-skin="button"
                :aria-label="playState.isPlaying.value ? t('stepPanel.pause') : t('stepPanel.play')"
                :aria-pressed="playState.isPlaying.value"
                :data-testid="`${testIdPrefix}-play`"
                :disabled="totalSteps <= 1"
                class="size-11 shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center cursor-pointer shadow-primary transition-all duration-200 disabled:opacity-40 disabled:cursor-default disabled:shadow-none"
                @click="emit('togglePlay')"
            >
                <Pause
                    v-if="playState.isPlaying.value"
                    :size="20"
                />
                <Play
                    v-else
                    :size="20"
                    class="ml-0.5"
                />
            </button>
            <ProgressBar
                :current-step="stepIndex"
                :play-state="playState"
                :testid-prefix="`${testIdPrefix}-`"
                :total-steps="Math.max(0, totalSteps - 1)"
                class="flex-1"
                @seek="emit('goTo', $event)"
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { nextTick, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Pause, Play } from "lucide-vue-next";
import type { PlayState } from "@/presentation/components/playback/useProgressDrag";
import ProgressBar from "@/presentation/components/playback/ProgressBar.vue";
import StepNavigator from "@/presentation/components/step-presentation/StepNavigator.vue";
import StepExplanation from "@/presentation/components/step-presentation/StepExplanation.vue";
import { vPress } from "@/presentation/directives/press";

const props = withDefaults(defineProps<{
    stepIndex: number;
    totalSteps: number;
    playState: PlayState;
    testIdPrefix: string;
    /** The group's accessible name. */
    label: string;
    maxHeight?: number | null;
    /** The explanations always fit one line, so the panel need not keep room for three. */
    compactExplanation?: boolean;
}>(), { maxHeight: null, compactExplanation: false });

const emit = defineEmits<{
    previous: [];
    next: [];
    goTo: [index: number];
    togglePlay: [];
}>();

const { t } = useI18n();

// A new height cap can clip the explanation, or stop clipping it.
const explanationRegion = useTemplateRef<InstanceType<typeof StepExplanation>>("explanation");
watch(() => props.maxHeight, () => { void nextTick(() => { explanationRegion.value?.updateClipped(); }); });
</script>
