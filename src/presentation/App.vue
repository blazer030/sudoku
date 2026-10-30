<template>
    <div class="app-safe-area max-w-screen-sm h-dvh mx-auto">
        <!-- Scrolls a page taller than the safe area, clipped at the insets -->
        <div
            ref="pageScroller"
            class="h-full overflow-y-auto overscroll-y-contain"
            data-skin="page-ruled page-scroller"
            data-testid="page-scroller"
        >
            <RouterView />
        </div>
    </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
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

// Android's WebView keeps the scroll offset when the window grows (split screen, a foldable), even
// past what the page can scroll, leaving its top cut off with no way back
const keepScrollInReach = () => {
    const scroller = pageScroller.value;
    if (!scroller) return;
    const furthest = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    if (scroller.scrollTop > furthest) scroller.scrollTop = furthest;
};
onMounted(() => {
    window.addEventListener("resize", keepScrollInReach);
});
onBeforeUnmount(() => {
    window.removeEventListener("resize", keepScrollInReach);
});
</script>
