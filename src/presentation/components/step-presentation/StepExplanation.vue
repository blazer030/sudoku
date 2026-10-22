<template>
    <!-- The only part that gives way when a long explanation would push the buttons off screen.
         It stays mounted across steps, so it can announce each new explanation. -->
    <div
        ref="box"
        :class="clipped ? 'step-explanation-fade' : ''"
        :data-testid="`${testIdPrefix}-explanation-region`"
        aria-live="polite"
        class="step-explanation-box min-h-[4.6rem] shrink! overflow-y-auto"
        @scroll="updateClipped"
    >
        <Transition
            mode="out-in"
            name="step-swap"
            @before-enter="scrollToTop"
            @after-enter="updateClipped"
        >
            <p
                :key="`explanation-${stepKey}`"
                :data-testid="`${testIdPrefix}-explanation`"
                class="text-foreground text-[14.5px] leading-[1.6]"
            >
                <slot />
            </p>
        </Transition>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onUpdated, ref, useTemplateRef } from "vue";

defineProps<{
    stepKey: string | number;
    testIdPrefix: string;
}>();

// When the panel is height-capped, fade the cut-off edge so a long explanation reads as scrollable.
const box = useTemplateRef<HTMLElement>("box");
const clipped = ref(false);

const updateClipped = () => {
    const element = box.value;
    if (element === null) return;
    clipped.value = element.scrollTop + element.clientHeight < element.scrollHeight - 1;
};

const scrollToTop = () => {
    if (box.value !== null) box.value.scrollTop = 0;
};

onMounted(updateClipped);
onUpdated(updateClipped);

defineExpose({ updateClipped });
</script>

<style scoped>
/* Short screens let the explanation shrink to one line, so the buttons below stay on screen. */
@media (max-height: 700px) {
    .step-explanation-box {
        min-height: 1.45rem;
    }
}

.step-explanation-fade {
    /* The mask only reads alpha, so any opaque token works */
    mask-image: linear-gradient(to bottom, var(--color-foreground) calc(100% - 1.5rem), transparent);
}
</style>
