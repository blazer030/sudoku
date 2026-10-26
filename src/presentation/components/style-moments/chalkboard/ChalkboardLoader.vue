<template>
    <div class="chalkboard-loader relative flex flex-col items-center gap-3 overflow-hidden bg-card pt-[22px] px-[34px] pb-[18px] text-foreground">
        <!-- A small board. skin.css chalks a sudoku box (the outline in one stroke, then the four inner lines), rings a
             cell in yellow chalk and writes its digit through a reveal mask with a puff of dust (黑板 only), four
             cells in turn; then the duster drags its smear across, fading the sketch to a ghost, and every piece
             is hidden again for the next round. 白板 is the same in marker: no grain and no dust. Under reduced
             motion the sketch is finished, the last cell ringed, with its smear. -->
        <div
            class="chalkboard-loader-sketch relative size-[120px]"
            aria-hidden="true"
        >
            <svg
                class="chalkboard-loader-chalk absolute inset-0 overflow-visible"
                viewBox="0 0 120 120"
                width="120"
                height="120"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <defs>
                    <!-- Alpha masks, wiped on left to right as the digit is written -->
                    <mask
                        v-for="(digit, step) in DIGITS"
                        :id="maskIdOf(step)"
                        :key="step"
                        style="mask-type: alpha"
                        maskUnits="userSpaceOnUse"
                        :x="digit.left"
                        :y="digit.top"
                        :width="CELL"
                        :height="CELL"
                    >
                        <path
                            class="chalkboard-loader-reveal"
                            :data-step="step"
                            :d="`M${digit.left} ${digit.top + CELL / 2} H${digit.left + CELL}`"
                            :stroke-width="CELL"
                            stroke-linecap="butt"
                            pathLength="100"
                        />
                    </mask>
                </defs>
                <path
                    v-for="(stroke, step) in STROKES"
                    :key="step"
                    class="chalkboard-loader-stroke"
                    :data-step="step"
                    :d="stroke"
                    stroke-width="3"
                    pathLength="100"
                />
                <path
                    v-for="(digit, step) in DIGITS"
                    :key="step"
                    class="chalkboard-loader-ring text-primary"
                    :data-step="step"
                    :d="digit.ring"
                    stroke-width="2.6"
                    pathLength="100"
                />
                <text
                    v-for="(digit, step) in DIGITS"
                    :key="step"
                    class="chalkboard-loader-digit font-mono"
                    :data-step="step"
                    :mask="`url(#${maskIdOf(step)})`"
                    :x="digit.left + CELL / 2"
                    :y="digit.top + CELL / 2"
                    text-anchor="middle"
                    dominant-baseline="central"
                    font-size="27"
                    fill="currentColor"
                    stroke="none"
                >{{ digit.value }}</text>
            </svg>
            <!-- Chalk dust, a few specks below each digit as it is written; apart from the chalk, so the grain
                 does not eat them -->
            <svg
                class="absolute inset-0 overflow-visible"
                viewBox="0 0 120 120"
                width="120"
                height="120"
                fill="currentColor"
            >
                <g
                    v-for="(digit, step) in DIGITS"
                    :key="step"
                    class="chalkboard-loader-dust"
                    :data-step="step"
                >
                    <circle
                        v-for="(speck, index) in SPECKS"
                        :key="index"
                        :cx="digit.left + DUST_LEFT + speck.dx"
                        :cy="digit.top + DUST_TOP + speck.dy"
                        :r="speck.radius"
                    />
                </g>
            </svg>
            <!-- The canvas's wiper: a soft smear round the duster, dragged across with it -->
            <span class="chalkboard-loader-smear absolute -top-1.5 -left-[30px] h-[132px] w-[100px]" />
            <span class="chalkboard-loader-duster absolute left-1 top-[46px] h-7 w-8" />
        </div>
        <p class="chalkboard-loader-caption m-0 text-[15px] text-foreground">
            {{ message ?? t("home.generatingPuzzle") }}
        </p>
    </div>
</template>

<script lang="ts" setup>
import { useId } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

withDefaults(defineProps<{
    message?: string;
}>(), {
    message: undefined,
});

// One cell of the small board, in its 120-unit viewBox
const CELL = 32;

// The sudoku box in the order it is chalked: the outline in one stroke, then the two lines down and the two across
const STROKES = [
    "M12 13 C 45 11, 78 13.5, 108 11.5 C 109.5 45, 107.5 78, 109 108.5 C 76 110, 44 107.5, 11.5 109 C 13 76, 10.5 44, 12 13",
    "M44 11 Q 42.5 60 45 110",
    "M76 10 Q 77.5 58 75 110",
    "M10 44 Q 60 42 110 45.5",
    "M10 76 Q 62 78 110 75",
];

// The cells solved in turn, by their top left corner, each with the loop of yellow chalk round it
const DIGITS = [
    { value: 5, left: 12, top: 12, ring: "M31 16 C 43 17, 42 40, 28 40 C 15 40, 14 18, 33 15.5" },
    { value: 9, left: 44, top: 76, ring: "M63 80 C 75 81, 74 104, 60 104 C 47 104, 46 82, 65 79.5" },
    { value: 1, left: 76, top: 12, ring: "M95 16 C 107 17, 106 40, 92 40 C 79 40, 78 18, 97 15.5" },
    { value: 7, left: 44, top: 44, ring: "M63 48 C 75 49, 74 72, 60 72 C 47 72, 46 50, 65 47.5" },
];

// Where a digit's dust drops from, below and left of its centre, and the three specks that fall
const DUST_LEFT = 9.5;
const DUST_TOP = 27.5;
const SPECKS = [
    { dx: 0, dy: 0, radius: 1.5 },
    { dx: 5, dy: 3, radius: 1.1 },
    { dx: -4, dy: 6, radius: 1.1 },
];

// Two loaders on one screen keep their masks apart
const idSuffix = useId().replace(/\W/g, "");
const maskIdOf = (step: number): string => `chalkboard-loader-${idSuffix}-${step}`;
</script>
