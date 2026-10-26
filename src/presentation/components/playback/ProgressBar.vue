<template>
    <div class="flex flex-col gap-1.5 w-full">
        <div
            ref="progressBarRef"
            class="group w-full h-6 flex items-center cursor-pointer"
            :data-testid="`${testidPrefix}progress-bar`"
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
                    :data-testid="`${testidPrefix}progress-fill`"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, toRef } from "vue";
import { type PlayState, useProgressDrag } from "@/presentation/components/playback/useProgressDrag";

const props = withDefaults(defineProps<{
    currentStep: number;
    totalSteps: number;
    playState: PlayState;
    testidPrefix?: string;
}>(), {
    testidPrefix: "",
});

const emit = defineEmits<{
    seek: [step: number];
}>();

const progressBarRef = ref<HTMLElement | null>(null);
const totalStepsRef = toRef(props, "totalSteps");

const progressPercent = computed(() => {
    if (props.totalSteps === 0) return "0%";
    return `${(props.currentStep / props.totalSteps) * 100}%`;
});

const { isDragging, onPointerDown } = useProgressDrag(
    progressBarRef,
    totalStepsRef,
    (step) => {
        emit("seek", step);
    },
    props.playState,
);
</script>
