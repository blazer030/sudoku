<template>
    <div class="flex items-center gap-3">
        <div
            :class="game.completed
                ? 'bg-primary-light text-primary'
                : 'bg-accent/10 text-accent'"
            :data-skin="game.completed ? 'icon-tile' : 'icon-tile gave-up'"
            class="w-9 h-9 rounded-icon flex items-center justify-center"
        >
            <Trophy
                v-if="game.completed"
                :size="18"
            />
            <X
                v-else
                :size="18"
            />
        </div>
        <div class="flex flex-col gap-0.5">
            <span class="text-sm font-semibold text-foreground">
                {{ difficultyLabel(game.difficulty) }}
            </span>
            <span class="text-[11px] text-foreground-muted">
                {{ formatDate(game.date, appLocale) }}
            </span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { GameResult } from "@/application/statistics/StatisticsRepository";
import { Trophy, X } from "@/presentation/components/icon";
import { useDifficultyLabel } from "@/presentation/i18n/difficultyLabels";
import { formatDate } from "@/presentation/i18n/formatDate";
import { useAppLocale } from "@/presentation/i18n/useAppLocale";

/** A played game's trophy or cross, its difficulty and when it was played, as Statistics and Game Review show it. */
defineProps<{
    game: Pick<GameResult, "completed" | "difficulty" | "date">;
}>();

const appLocale = useAppLocale();
const difficultyLabel = useDifficultyLabel();
</script>
