<template>
    <button
        v-if="savedGame !== null"
        v-press
        data-skin="button continue"
        class="flex flex-col items-start gap-2.5 w-full bg-featured text-on-featured rounded-2xl shadow-primary px-5 py-4 cursor-pointer"
        data-testid="continue-button"
        type="button"
        @click="$emit('continue')"
    >
        <span class="flex items-center gap-2">
            <Play :size="20" />
            <span class="text-lg font-semibold">{{ t("home.continueGame") }}</span>
        </span>
        <span class="flex flex-wrap gap-1.5">
            <span
                class="text-sm bg-on-featured/20 rounded-full px-2.5 py-0.5"
                data-testid="continue-difficulty"
            >{{ difficultyLabel(savedGame.difficulty) }}</span>
            <span
                class="text-sm bg-on-featured/20 rounded-full px-2.5 py-0.5"
                data-testid="continue-time"
            >{{ formatTime(savedGame.elapsedSeconds) }}</span>
            <span
                class="text-sm bg-on-featured/20 rounded-full px-2.5 py-0.5"
                data-testid="continue-progress"
            >{{ t("home.continueProgress", { percent: progressPercent }) }}</span>
        </span>
    </button>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { Play } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import { useGameStore } from "@/stores/gameStore";
import { computeAbandonProgress } from "@/application/analytics/computeAbandonProgress";
import { formatTime } from "@/utils/formatTime";
import { useDifficultyLabel } from "@/presentation/i18n/difficultyLabels";
import { vPress } from "@/presentation/directives/press";

const { t } = useI18n();
const difficultyLabel = useDifficultyLabel();

defineEmits<{ continue: [] }>();

const { savedGame } = storeToRefs(useGameStore());
// Only the player's cells count, so a fresh save reads 0% rather than the clue share
const progressPercent = computed(() =>
    savedGame.value === null ? 0 : computeAbandonProgress(savedGame.value.cells, savedGame.value.answer).progressPct
);
</script>
