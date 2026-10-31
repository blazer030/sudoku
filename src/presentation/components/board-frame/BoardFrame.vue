<template>
    <component
        :is="frame"
        v-if="frame !== null"
        v-bind="props"
    >
        <slot />
    </component>
    <slot v-else />
</template>

<script lang="ts" setup>
import { useBoardFrame, type BoardFrameProps } from "@/presentation/components/board-frame/boardFrames";

const props = defineProps<BoardFrameProps>();

const frame = useBoardFrame();
</script>
