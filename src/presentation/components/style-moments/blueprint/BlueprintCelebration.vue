<template>
    <!-- Over the completion scene, behind the dialog: the amber 核可 approval stamp is pressed on over the header's
         right end, in a double line of the primary on a ground of the paper so the header never shows through it,
         with the drawing's revision below. skin.css presses it; still, it is simply there. -->
    <div
        class="blueprint-celebration pointer-events-none absolute inset-0 overflow-hidden"
        :data-still="still ? '' : undefined"
        aria-hidden="true"
    >
        <div class="relative mx-auto h-full max-w-screen-sm">
            <span
                class="blueprint-stamp absolute top-[calc(env(safe-area-inset-top)+20px)] right-[10px] flex flex-col items-center border-3 border-double border-primary px-3 py-1.5 text-primary"
            >
                <!-- Spaced out inline, as Chinese drops the tracking classes: two characters wide apart, a word a
                     little, so APPROVED stays clear of the timer -->
                <span
                    class="blueprint-stamp-word font-sans text-2xl leading-[1.1] font-semibold"
                    :style="{ letterSpacing: locale === 'zh-Hant' ? '0.3em' : '0.1em' }"
                >{{ t("game.complete.approvalStamp") }}</span>
                <span
                    class="blueprint-stamp-revision font-mono text-[9px] leading-[1.1] font-medium"
                    style="letter-spacing: 0.12em"
                >{{ t("game.complete.approvalRevision", { version: REVISION }) }}</span>
            </span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { appVersion } from "@/utils/appVersion";

withDefaults(defineProps<{
    still?: boolean;
}>(), {
    still: false,
});

const { t, locale } = useI18n();

// A drawing's revision is the app's major.minor
const REVISION = appVersion.split(".").slice(0, 2).join(".");
</script>
