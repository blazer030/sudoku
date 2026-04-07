<template>
    <button
        v-if="showContinue"
        class="flex items-center justify-center gap-2.5 h-14 w-full bg-primary rounded-2xl text-white shadow-primary cursor-pointer transition-all duration-200 hover:bg-[#347A4E] hover:shadow-primary-lg"
        data-testid="continue-button"
        @click="$emit('continue')"
    >
        <Play :size="20" />
        <span class="text-base font-semibold">Continue Game</span>
        <span class="bg-white/20 rounded-full px-2.5 py-1 text-xs font-medium">
            {{ savedTimeLabel }}
        </span>
    </button>
</template>

<script lang="ts" setup>
import { Play } from "lucide-vue-next";
import { hasSavedGame, loadGame } from "@/application/GameStorage";
import { formatTime } from "@/utils/formatTime";

defineEmits<{ continue: [] }>();

const showContinue = hasSavedGame();
const saved = loadGame();
const savedTimeLabel = saved ? formatTime(saved.elapsedSeconds) : "00:00";
</script>
