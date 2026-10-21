<template>
    <button
        v-if="showContinue"
        v-press
        class="flex items-center justify-center gap-2.5 h-14 w-full bg-primary rounded-2xl text-on-primary shadow-primary cursor-pointer transition-all duration-200 hover:bg-primary-hover hover:shadow-primary-lg"
        data-testid="continue-button"
        @click="$emit('continue')"
    >
        <Play :size="20" />
        <span class="text-base font-semibold">{{ t("home.continueGame") }}</span>
        <span class="bg-on-primary/20 rounded-full px-2.5 py-1 text-xs font-medium">
            {{ savedTimeLabel }}
        </span>
    </button>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Play } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import { useGameStore } from "@/stores/gameStore";
import { formatTime } from "@/utils/formatTime";
import { vPress } from "@/presentation/directives/press";

const { t } = useI18n();

defineEmits<{ continue: [] }>();

const gameStore = useGameStore();
const showContinue = computed(() => gameStore.savedGame !== null);
const savedTimeLabel = computed(() =>
    gameStore.savedGame === null ? "00:00" : formatTime(gameStore.savedGame.elapsedSeconds)
);
</script>
