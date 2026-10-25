<template>
    <!-- Drawn on the completion card: a round rubber stamp with today's date in its top right corner.
         skin.css inks it and stamps it last, the card sinking under it and a faint ring spreading out;
         a still card has it there already, without the ring. -->
    <span
        v-if="!still"
        class="paper-stamp-splat pointer-events-none absolute -top-[26px] -right-[18px] z-[1] size-[108px] rounded-full border-2"
        aria-hidden="true"
    />
    <span
        class="paper-stamp pointer-events-none absolute -top-5 -right-3 z-[2] flex size-24 flex-col items-center justify-center gap-px rounded-full border-3"
        aria-hidden="true"
    >
        <!-- A short word fills the ring at the board's size; a longer one is set smaller so it stays inside -->
        <b
            :class="['font-hand font-bold leading-none', isShortWord ? 'text-[26px] tracking-[0.06em]' : 'text-[20px] tracking-normal']"
        >{{ word }}</b>
        <small class="font-hand text-[14px] font-bold leading-none tracking-[0.04em]">{{ date }}</small>
    </span>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

withDefaults(defineProps<{
    still?: boolean;
}>(), {
    still: false,
});

const word = computed(() => t("game.complete.stamp"));
// Up to three characters fit the ring at 26px (「完成」); "SOLVED" in Caveat needs 20px
const isShortWord = computed(() => Array.from(word.value).length <= 3);

// The day it was solved, as the app writes short dates: month/day, no year, no padding
const today = new Date();
const date = `${today.getMonth() + 1}/${today.getDate()}`;
</script>
