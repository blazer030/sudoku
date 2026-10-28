<template>
    <!-- Paper's pen: the stroke writer over paper's strokes and Caveat's metrics. skin.css runs the strokes. -->
    <StrokeDigitWriter
        :digit="digit"
        :mask-id="maskId"
        :face="PAPER_STROKE_FACE"
        stroke-class="paper-digit-stroke"
        settle-class="paper-digit-settle"
        @written="emit('written')"
    />
</template>

<script lang="ts" setup>
import StrokeDigitWriter from "@/presentation/components/style-moments/StrokeDigitWriter.vue";
import { PAPER_STROKE_FACE } from "@/presentation/components/style-moments/paper/paperDigitStrokes";

defineProps<{
    digit: number;
    maskId: string;
}>();

const emit = defineEmits<{
    written: [];
}>();
</script>
