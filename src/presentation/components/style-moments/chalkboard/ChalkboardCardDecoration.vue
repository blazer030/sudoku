<template>
    <!-- Round the top of the completion card, beside the cheer and the trophy: two stars, a wave and a fan of rays,
         doodled in turn in the yellow, pink and blue chalk (markers on 白板). MomentsChalk's doodles, moved from round
         its screen onto the card so the card never hides them; laid out on the card's top 200px, clear of the cheer,
         the trophy and the title. skin.css draws them on and grains them in 黑板; on a still card they are there. -->
    <svg
        class="chalkboard-doodles pointer-events-none absolute inset-x-0 top-0 h-[200px] w-full"
        viewBox="0 0 354 200"
        preserveAspectRatio="xMidYMin meet"
        aria-hidden="true"
    >
        <path
            v-for="(doodle, step) in DOODLES"
            :key="step"
            class="chalkboard-doodle"
            :data-shape="doodle.shape"
            :data-step="step"
            :data-tone="doodle.tone"
            :d="doodle.path"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
    </svg>
    <!-- Written on the completion card above the trophy, beside the real title: the cheer in yellow chalk (an
         orange marker on 白板), a little askew. skin.css writes it in from the left a step at a time and drops
         three specks of dust off it as it goes (黑板 only); a still card has it written already, so no dust falls. -->
    <span
        class="chalkboard-cheer relative -mt-2.5 -mb-1.5 block -rotate-4 text-center text-[36px] leading-[1.15] font-bold"
        aria-hidden="true"
    >
        <span class="chalkboard-cheer-text block">{{ t("game.complete.cheer") }}</span>
        <template v-if="!still">
            <span
                v-for="(place, step) in DUST_PLACES"
                :key="step"
                :class="['chalkboard-cheer-dust absolute top-full size-[3px] rounded-full', place]"
                :data-step="step"
            />
        </template>
    </span>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

withDefaults(defineProps<{
    still?: boolean;
}>(), {
    still: false,
});

// MomentsChalk's doodles, in the order they are drawn, in the card's units (354 wide, the cheer on y 22–64, the
// trophy's circle on 137–217 × 81–161): a yellow star top left and a pink one top right, either side of the cheer;
// a blue wave left of the trophy, drawn smaller to fit; yellow rays fanning out right of it
const DOODLES = [
    { shape: "star", tone: "primary", path: "M44 16 l8 22 22 2 -18 14 7 22 -19 -13 -19 13 7 -22 -18 -14 22 -2z" },
    { shape: "star", tone: "doodle", path: "M300 22 l6 16 17 1 -13 11 5 16 -15 -10 -14 10 5 -16 -13 -11 17 -1z" },
    { shape: "wave", tone: "accent", path: "M18 132 q24 -32 48 0 t48 0" },
    { shape: "rays", tone: "primary", path: "M234 120 l40 -30 M244 140 l46 -10 M252 160 l40 12" },
] as const;

// Where MomentsChalk's dust falls from under the cheer, left to right as it is written
const DUST_PLACES = ["left-1/4", "left-1/2", "left-3/4"];
</script>
