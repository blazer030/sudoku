<template>
    <div class="flex items-center justify-center gap-5">
        <button
            class="size-11 rounded-xl bg-card shadow-card-sm flex items-center justify-center cursor-pointer hover:bg-foreground/5"
            :data-testid="`${testidPrefix}first-step-button`"
            @click="emit('first')"
        >
            <SkipBack :size="20" />
        </button>
        <button
            class="size-11 rounded-xl bg-card shadow-card-sm flex items-center justify-center cursor-pointer hover:bg-foreground/5"
            :data-testid="`${testidPrefix}prev-step-button`"
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
            class="size-11 rounded-xl bg-card shadow-card-sm flex items-center justify-center cursor-pointer hover:bg-foreground/5"
            :data-testid="`${testidPrefix}next-step-button`"
            @click="emit('next')"
        >
            <ChevronRight :size="22" />
        </button>
        <button
            class="size-11 rounded-xl bg-card shadow-card-sm flex items-center justify-center cursor-pointer hover:bg-foreground/5"
            :data-testid="`${testidPrefix}last-step-button`"
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
    testidPrefix?: string;
}>(), {
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
