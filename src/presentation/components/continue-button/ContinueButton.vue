<template>
    <button
        v-if="savedGame !== null"
        v-press
        data-skin="button continue"
        :data-layout="layout"
        :class="titleBlock ? 'items-stretch' : 'items-start gap-2.5 px-5 py-4'"
        class="flex flex-col w-full bg-featured text-on-featured rounded-2xl shadow-primary cursor-pointer"
        data-testid="continue-button"
        type="button"
        @click="$emit('continue')"
    >
        <span
            :class="titleBlock ? 'py-3 px-4 border-b border-on-featured' : ''"
            class="flex items-center gap-2"
        >
            <Play
                :size="20"
                data-skin="caret"
            />
            <span class="text-lg font-semibold">{{ t("home.continueGame") }}</span>
        </span>
        <!-- A title block's columns are equal and ruled apart; a style draws each chip's caption -->
        <span :class="titleBlock ? 'flex' : 'flex flex-wrap gap-1.5'">
            <span
                v-for="(chip, chipIndex) in chips"
                :key="chip.id"
                :class="titleBlock
                    ? ['flex-1 flex flex-col items-start gap-0.5 text-sm px-3 py-2', { 'border-r border-border': chipIndex < chips.length - 1 }]
                    : 'text-sm bg-on-featured/20 rounded-full px-2.5 py-0.5'"
                :data-caption="chip.caption"
                data-skin="chip"
                :data-testid="`continue-${chip.id}`"
            >{{ chip.text }}</span>
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
import { useSettingsStore } from "@/stores/settingsStore";
import { CONTINUE_LAYOUTS } from "@/presentation/components/continue-button/continueLayouts";

const { t } = useI18n();
const difficultyLabel = useDifficultyLabel();

defineEmits<{ continue: [] }>();

const { savedGame } = storeToRefs(useGameStore());
// Only the player's cells count, so a fresh save reads 0% rather than the clue share
const progressPercent = computed(() =>
    savedGame.value === null ? 0 : computeAbandonProgress(savedGame.value.cells, savedGame.value.answer).progressPct
);

const settings = useSettingsStore();
const layout = computed(() => CONTINUE_LAYOUTS[settings.style]);
const titleBlock = computed(() => layout.value === "title-block");

const chips = computed(() => savedGame.value === null ? [] : [
    { id: "difficulty", caption: t("home.continueCaptions.difficulty"), text: difficultyLabel(savedGame.value.difficulty) },
    { id: "time", caption: t("home.continueCaptions.time"), text: formatTime(savedGame.value.elapsedSeconds) },
    { id: "progress", caption: t("home.continueCaptions.progress"), text: t("home.continueProgress", { percent: progressPercent.value }) },
]);
</script>
