<template>
    <!-- Over the completion scene, behind the dialog: a dashed HUD ring turns in and keeps turning, and
         「// MISSION COMPLETE」 glitches in above it, then now and then. The scrim takes faint scanlines.
         skin.css draws and moves them; still, the ring and the text simply sit there. -->
    <div
        class="cyber-celebration pointer-events-none absolute inset-0 overflow-hidden"
        :data-still="still ? '' : undefined"
        aria-hidden="true"
    >
        <div class="cyber-celebration-ring-in absolute top-1/2 left-1/2 -mt-[210px] -ml-[210px] size-[420px]">
            <div class="cyber-celebration-ring size-full rounded-full border border-dashed" />
        </div>
        <!-- English in both languages, so its tracking is inline: Chinese drops the tracking classes -->
        <p
            class="cyber-mission absolute inset-x-0 top-[calc(env(safe-area-inset-top)+78px)] m-0 text-center text-base leading-none"
            style="letter-spacing: 0.3em"
        >
            // MISSION COMPLETE
        </p>
    </div>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
    still?: boolean;
}>(), {
    still: false,
});
</script>
