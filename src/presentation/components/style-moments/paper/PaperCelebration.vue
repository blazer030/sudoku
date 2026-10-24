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
        <!-- Two characters fill the ring at the board's size; the English word in Caveat is wider, so it is set smaller -->
        <b
            :class="['font-hand font-bold leading-none', locale === 'zh-Hant' ? 'text-[26px] tracking-[0.06em]' : 'text-[20px] tracking-normal']"
        >{{ t("game.complete.stamp") }}</b>
        <small class="font-mono text-[10px] font-medium leading-none tracking-[0.08em]">{{ date }}</small>
    </span>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();

withDefaults(defineProps<{
    still?: boolean;
}>(), {
    still: false,
});

const pad = (value: number): string => String(value).padStart(2, "0");

// The day it was solved, as a slash date without the year
const today = new Date();
const date = `${pad(today.getMonth() + 1)}/${pad(today.getDate())}`;
</script>
