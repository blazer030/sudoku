<template>
    <!-- Drawn on the completion card, so it stands on the card's top edge however tall the screen is: the amber
         核可 approval stamp is pressed on just above the card's right end, its foot a few px clear of the card
         through its tilt, in a double line of the primary on a ground of the paper, with the drawing's revision
         below. skin.css presses it; on a still card it is simply there. -->
    <span
        class="blueprint-stamp pointer-events-none absolute right-4 bottom-full mb-5 flex flex-col items-center border-3 border-double border-primary px-3 py-1.5 text-primary"
        aria-hidden="true"
    >
        <!-- Spaced out inline, as Chinese drops the tracking classes: two characters wide apart, a word a little -->
        <span
            class="blueprint-stamp-word font-sans text-2xl leading-[1.1] font-semibold"
            :style="{ letterSpacing: locale === 'zh-Hant' ? '0.3em' : '0.1em' }"
        >{{ t("game.complete.approvalStamp") }}</span>
        <span
            class="blueprint-stamp-revision font-mono text-[9px] leading-[1.1] font-medium"
            style="letter-spacing: 0.12em"
        >{{ t("game.complete.approvalRevision", { version: REVISION }) }}</span>
    </span>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { appVersion } from "@/utils/appVersion";

// The stamp is the same still or not; the skin holds back its motion on a still card
withDefaults(defineProps<{
    still?: boolean;
}>(), {
    still: false,
});

const { t, locale } = useI18n();

// A drawing's revision is the app's major.minor
const REVISION = appVersion.split(".").slice(0, 2).join(".");
</script>
