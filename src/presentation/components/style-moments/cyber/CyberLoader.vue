<template>
    <div
        class="cyber-loader flex w-[278px] flex-col gap-3.5 pt-4 px-[18px] pb-[18px] text-foreground"
        data-skin="card"
    >
        <!-- A HUD panel. skin.css counter-rotates the two rings, lights the 3×3's squares magenta at their
             own beats, types the generator's log a line at a time and runs the bar up, jumping it back once;
             under reduced motion the rings stand, the odd squares are lit, the log is written and the bar
             part-filled. The English decoration keeps its tracking in Chinese too, so it is set inline:
             Chinese drops the tracking classes. -->
        <div
            class="cyber-loader-head flex justify-between text-[11px] leading-none"
            style="letter-spacing: 0.14em"
            aria-hidden="true"
        >
            <span>// GENERATING</span>
            <span class="cyber-loader-grid">GRID 9×9</span>
        </div>
        <div
            class="cyber-loader-ring relative size-[132px] self-center"
            aria-hidden="true"
        >
            <span class="cyber-loader-orbit absolute inset-0 rounded-full border border-dashed" />
            <span class="cyber-loader-arc absolute inset-3.5 rounded-full border-2" />
            <span class="absolute top-1/2 left-1/2 -mt-[19px] -ml-[19px] grid grid-cols-[repeat(3,10px)] gap-1">
                <span
                    v-for="(delayMs, square) in LIGHTING_DELAY_MS"
                    :key="square"
                    class="cyber-loader-square block size-2.5 border"
                    :style="{ '--cyber-loader-delay': `${delayMs}ms` }"
                />
            </span>
        </div>
        <div
            class="cyber-loader-log h-14 text-[11.5px] leading-[1.6]"
            aria-hidden="true"
        >
            <span class="cyber-loader-line block w-fit whitespace-nowrap">&gt; SEED 0x3F2A9C</span>
            <span class="cyber-loader-line block w-fit whitespace-nowrap">&gt; CARVE CLUES 32/81</span>
            <span class="cyber-loader-line block w-fit whitespace-nowrap">&gt; VERIFY UNIQUE .. <span class="cyber-loader-ok">OK</span></span>
        </div>
        <div
            class="cyber-loader-progress relative h-1.5 overflow-hidden"
            aria-hidden="true"
        >
            <span class="cyber-loader-fill absolute inset-0 origin-left" />
        </div>
        <p class="cyber-loader-caption m-0 text-center text-sm font-medium tracking-[0.14em]">
            {{ message ?? t("home.generatingPuzzle") }}
        </p>
    </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

withDefaults(defineProps<{
    message?: string;
}>(), {
    message: undefined,
});

// From the board: each square lights at its own beat in a 1.5s round, so they seem to light at random
const LIGHTING_DELAY_MS = [0, 900, 300, 1200, 600, 150, 1050, 450, 750];
</script>
