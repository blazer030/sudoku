<template>
    <FireworkCanvas v-if="!still" />
</template>

<script lang="ts" setup>
import FireworkCanvas from "@/presentation/components/firework-canvas/FireworkCanvas.vue";

withDefaults(defineProps<{
    still?: boolean;
}>(), {
    still: false,
});
</script>
