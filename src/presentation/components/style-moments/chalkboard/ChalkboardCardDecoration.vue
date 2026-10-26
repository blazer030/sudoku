<template>
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

// Where MomentsChalk's dust falls from under the cheer, left to right as it is written
const DUST_PLACES = ["left-1/4", "left-1/2", "left-3/4"];
</script>
