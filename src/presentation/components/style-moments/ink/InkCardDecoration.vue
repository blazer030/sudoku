<template>
    <!-- Drawn on the completion card: the scroll's two rods and a 「過關」 seal in its top right corner.
         skin.css unrolls the card from the top rod, the bottom rod travelling down with its edge (on a
         track the card's height, so the rod moves by transform), and presses the seal last; a still card
         hangs open with the seal already on it. 「過關」 is an emblem, the same in both languages. -->
    <span
        class="ink-rod top pointer-events-none absolute -inset-x-3 -top-[7px] z-[6] h-[9px] rounded-[5px]"
        aria-hidden="true"
    />
    <span
        class="ink-rod-track pointer-events-none absolute inset-0 z-[6]"
        aria-hidden="true"
    >
        <span class="ink-rod bottom absolute -inset-x-3 top-[calc(100%-2px)] h-[9px] rounded-[5px]" />
    </span>
    <span
        class="ink-seal-stamp pointer-events-none absolute top-[22px] right-5 z-[7] grid size-[58px] place-items-center p-1 text-[19px] leading-[1.05] font-black tracking-[0.06em] [writing-mode:vertical-rl]"
        aria-hidden="true"
    >過關</span>
</template>

<script lang="ts" setup>
// The seal and the rods are the same still or not; the skin holds back their motion on a still card
withDefaults(defineProps<{
    still?: boolean;
}>(), {
    still: false,
});
</script>
