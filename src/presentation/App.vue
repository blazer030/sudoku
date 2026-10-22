<template>
    <div class="app-safe-area max-w-screen-sm h-dvh mx-auto">
        <!-- Scrolls a page taller than the safe area, clipped at the insets -->
        <div
            ref="pageScroller"
            class="h-full overflow-y-auto overscroll-y-contain"
            data-testid="page-scroller"
        >
            <RouterView />
        </div>
    </div>
</template>

<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from "vue";
import { RouterView, useRoute } from "vue-router";

const route = useRoute();
const pageScroller = useTemplateRef<HTMLElement>("pageScroller");

// The scroller outlives route changes, so a new page would inherit the previous page's scroll offset
watch(
    () => route.fullPath,
    async () => {
        await nextTick();
        if (pageScroller.value) pageScroller.value.scrollTop = 0;
    },
);
</script>
