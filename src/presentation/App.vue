<template>
    <div class="app-safe-area max-w-screen-sm h-dvh mx-auto">
        <!-- Scrolls a page taller than the safe area, clipped at the insets -->
        <div
            class="h-full overflow-y-auto overscroll-y-contain"
            data-testid="page-scroller"
        >
            <RouterView />
        </div>
    </div>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
</script>
