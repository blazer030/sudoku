<template>
    <div class="flex items-center justify-center gap-5">
        <button
            class="size-11 rounded-xl bg-card shadow-card-sm flex items-center justify-center cursor-pointer hover:bg-foreground/5 disabled:opacity-40 disabled:pointer-events-none"
            :data-testid="`${testidPrefix}first-step-button`"
            :disabled="!canGoPrev"
            @click="emit('first')"
        >
            <SkipBack :size="20" />
        </button>
        <button
            class="size-11 rounded-xl bg-card shadow-card-sm flex items-center justify-center cursor-pointer hover:bg-foreground/5 disabled:opacity-40 disabled:pointer-events-none"
            :data-testid="`${testidPrefix}prev-step-button`"
            :disabled="!canGoPrev"
            @click="emit('prev')"
        >
            <ChevronLeft :size="22" />
        </button>
        <button
            class="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary/90"
            :data-testid="`${testidPrefix}play-button`"
            @click="emit('toggle-play')"
        >
            <Pause
                v-if="isPlaying"
                :size="24"
            />
            <Play
                v-else
                :size="24"
            />
        </button>
        <button
            class="size-11 rounded-xl bg-card shadow-card-sm flex items-center justify-center cursor-pointer hover:bg-foreground/5 disabled:opacity-40 disabled:pointer-events-none"
            :data-testid="`${testidPrefix}next-step-button`"
            :disabled="!canGoNext"
            @click="emit('next')"
        >
            <ChevronRight :size="22" />
        </button>
        <button
            class="size-11 rounded-xl bg-card shadow-card-sm flex items-center justify-center cursor-pointer hover:bg-foreground/5 disabled:opacity-40 disabled:pointer-events-none"
            :data-testid="`${testidPrefix}last-step-button`"
            :disabled="!canGoNext"
            @click="emit('last')"
        >
            <SkipForward :size="20" />
        </button>
    </div>
</template>

<script lang="ts" setup>
import { ChevronLeft, ChevronRight, Pause, Play, SkipBack, SkipForward } from "lucide-vue-next";

withDefaults(defineProps<{
    isPlaying: boolean;
    canGoPrev?: boolean;
    canGoNext?: boolean;
    testidPrefix?: string;
}>(), {
    canGoPrev: true,
    canGoNext: true,
    testidPrefix: "",
});

const emit = defineEmits<{
    first: [];
    prev: [];
    "toggle-play": [];
    next: [];
    last: [];
}>();
</script>
