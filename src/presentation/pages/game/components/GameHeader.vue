<template>
    <div class="grid grid-cols-[1fr_auto_1fr] items-center">
        <!-- A hint is finished or closed before the game can be left -->
        <button
            :disabled="hintMode"
            class="flex items-center gap-2 cursor-pointer justify-self-start disabled:opacity-40 disabled:cursor-default"
            data-testid="back-button"
            @click="emit('back')"
        >
            <ChevronLeft
                :size="24"
                class="text-foreground"
            />
            <span class="text-foreground text-base font-medium">
                {{ t("common.back") }}
            </span>
        </button>
        <div class="flex items-center gap-1.5">
            <Timer
                :size="18"
                class="text-foreground-secondary"
            />
            <span
                class="text-foreground text-lg font-timer font-semibold"
                data-testid="timer"
            >
                {{ formatTime(elapsedSeconds) }}
            </span>
        </div>
        <Transition
            mode="out-in"
            name="header-pill"
        >
            <div
                v-if="hintMode"
                class="justify-self-end flex items-center gap-1 bg-primary text-on-primary rounded-full pl-2 pr-3 py-1.5 shadow-primary-sm"
                data-skin="pill hint"
                data-testid="hint-mode-pill"
            >
                <Lightbulb :size="13" />
                <span class="text-xs font-semibold leading-none">
                    {{ t("hintMode.badge") }}
                </span>
            </div>
            <div
                v-else
                class="justify-self-end flex items-center bg-accent/15 rounded-full px-3 py-1.5"
                data-skin="pill"
            >
                <span class="text-accent text-xs font-semibold leading-none">
                    {{ difficultyLabel }}
                </span>
            </div>
        </Transition>
    </div>
</template>

<script lang="ts" setup>
import { ChevronLeft, Lightbulb, Timer } from "lucide-vue-next";
import { useGameStore } from "@/stores/gameStore";
import { formatTime } from "@/utils/formatTime";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useDifficultyLabel } from "@/presentation/i18n/difficultyLabels";

withDefaults(defineProps<{ elapsedSeconds: number; hintMode?: boolean }>(), { hintMode: false });
const emit = defineEmits<{ back: [] }>();

const { t } = useI18n();
const gameStore = useGameStore();

const difficultyText = useDifficultyLabel();
const difficultyLabel = computed(() => difficultyText(gameStore.difficulty ?? "easy"));
</script>

<style scoped>
.header-pill-enter-active,
.header-pill-leave-active {
    transition: opacity 160ms ease, transform 160ms ease;
}

.header-pill-enter-from,
.header-pill-leave-to {
    opacity: 0;
    transform: scale(0.9);
}
</style>
