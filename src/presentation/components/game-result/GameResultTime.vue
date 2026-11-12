<template>
    <div class="flex flex-col items-end gap-0.5">
        <span
            :class="game.completed ? 'text-primary' : 'text-accent'"
            :data-skin="game.completed ? 'game-result' : 'game-result gave-up'"
            class="text-base font-semibold font-mono"
        >
            {{ game.completed ? formatTime(game.elapsedSeconds) : t("statistics.gaveUp") }}
        </span>
        <span
            class="flex items-center gap-0.75 text-[11px] font-medium text-foreground-muted font-mono"
            data-testid="hints-used"
        >
            <Lightbulb :size="11" />
            {{ game.hintsUsed }}
        </span>
    </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import type { GameResult } from "@/application/statistics/StatisticsRepository";
import { Lightbulb } from "@/presentation/components/icon";
import { formatTime } from "@/utils/formatTime";

/** A played game's time, or that it was given up, and the hints it took, as Statistics and Game Review show it. */
defineProps<{
    game: Pick<GameResult, "completed" | "elapsedSeconds" | "hintsUsed">;
}>();

const { t } = useI18n();
</script>
