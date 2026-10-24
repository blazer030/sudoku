<template>
    <!-- Minimal draws nothing over the scene: the wash is on the board and the ring on the trophy
         (skin.css). This marker tells the skin whether the card rises and the ring draws, or both
         are simply there. -->
    <div
        class="minimal-celebration hidden"
        :data-still="still ? '' : undefined"
        aria-hidden="true"
    />
</template>

<script lang="ts" setup>
defineProps<{
    still: boolean;
}>();
</script>
