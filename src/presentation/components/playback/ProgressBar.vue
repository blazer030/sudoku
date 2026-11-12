<template>
    <div class="flex flex-col gap-1.5 w-full">
        <div
            ref="progressBar"
            class="group w-full h-6 flex items-center cursor-pointer"
            :data-testid="testIdOf('progress-bar')"
            @mousedown="onPointerDown"
            @touchstart="onPointerDown"
        >
            <div
                :class="isDragging ? 'h-3' : 'h-2 group-hover:h-3'"
                class="w-full bg-border rounded-full transition-all duration-150"
                data-skin="progress-track"
            >
                <div
                    :class="isDragging ? 'h-3' : 'h-2 group-hover:h-3'"
                    :style="{ width: progressPercent }"
                    class="bg-primary rounded-full transition-all duration-150"
                    data-skin="progress-fill"
                    :data-testid="testIdOf('progress-fill')"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, toRef, useTemplateRef } from "vue";
import type { PlayState } from "@/presentation/components/playback/usePlaybackState";
import { useProgressDrag } from "@/presentation/components/playback/useProgressDrag";

const props = withDefaults(defineProps<{
    currentStep: number;
    totalSteps: number;
    playState: PlayState;
    testIdPrefix?: string;
}>(), {
    testIdPrefix: "",
});

const emit = defineEmits<{
    seek: [step: number];
}>();

const progressBar = useTemplateRef<HTMLElement>("progressBar");

// The prefix names the page the bar is on: "review" gives "review-progress-bar"
const testIdOf = (name: string): string => (props.testIdPrefix === "" ? name : `${props.testIdPrefix}-${name}`);
const totalStepsRef = toRef(props, "totalSteps");

const progressPercent = computed(() => {
    if (props.totalSteps === 0) return "0%";
    return `${(props.currentStep / props.totalSteps) * 100}%`;
});

const { isDragging, onPointerDown } = useProgressDrag(
    progressBar,
    totalStepsRef,
    (step) => {
        emit("seek", step);
    },
    props.playState,
);
</script>
