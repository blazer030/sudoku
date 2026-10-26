<template>
    <!-- Over the completion scene, behind the dialog: once the teacher has ringed the board (the skin draws that
         ring on the board itself), two stars, a wave and a fan of rays are doodled round the scene in turn, in
         the yellow, pink and blue chalk (markers on 白板). From MomentsChalk's 390×844 screen, stretched to the
         scene. skin.css draws them on and grains them in 黑板; still, they are simply there. -->
    <div
        class="chalkboard-celebration pointer-events-none absolute inset-0 overflow-hidden"
        :data-still="still ? '' : undefined"
        aria-hidden="true"
    >
        <svg
            class="chalkboard-doodles absolute inset-0 size-full"
            viewBox="0 0 390 844"
            preserveAspectRatio="none"
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
    </div>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
    still?: boolean;
}>(), {
    still: false,
});

// MomentsChalk's doodles, in the order they are drawn: a yellow star top left, a pink one top right, a blue
// wave bottom left and yellow rays bottom right
const DOODLES = [
    { shape: "star", tone: "primary", path: "M54 120 l8 22 22 2 -18 14 7 22 -19 -13 -19 13 7 -22 -18 -14 22 -2z" },
    { shape: "star", tone: "doodle", path: "M318 96 l6 16 17 1 -13 11 5 16 -15 -10 -14 10 5 -16 -13 -11 17 -1z" },
    { shape: "wave", tone: "accent", path: "M40 730 q30 -40 60 0 t60 0" },
    { shape: "rays", tone: "primary", path: "M296 740 l40 -30 M306 760 l46 -10 M314 780 l40 12" },
] as const;
</script>
