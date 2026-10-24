<template>
    <!-- Over the completion scene: blinking stars, STAGE CLEAR dropping in a letter at a time and pixel
         bursts popping round the dialog. skin.css colours and steps them; still, STAGE CLEAR and the stars
         are simply there. -->
    <div
        class="pixel-celebration pointer-events-none absolute inset-0 overflow-hidden"
        :data-still="still ? '' : undefined"
        aria-hidden="true"
    >
        <div class="pixel-celebration-stars absolute inset-0" />
        <p class="pixel-stage-clear absolute inset-x-0 top-[calc(env(safe-area-inset-top)+78px)] m-0 flex justify-center text-[20px] leading-none">
            <template
                v-for="(letter, step) in STAGE_CLEAR"
                :key="step"
            >
                <span
                    v-if="letter === ' '"
                    class="block w-3.5"
                />
                <span
                    v-else
                    class="pixel-stage-letter block"
                    :style="{ '--pixel-letter-step': step }"
                >{{ letter }}</span>
            </template>
        </p>
        <template v-if="!still">
            <span
                v-for="burst in BURSTS"
                :key="`${burst.left}-${burst.top}`"
                class="pixel-burst absolute -mt-[3px] -ml-[3px] size-1.5"
                :style="{ left: burst.left, top: burst.top, '--pixel-burst-delay': `${burst.delayMs}ms` }"
            />
        </template>
    </div>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
    still?: boolean;
}>(), {
    still: false,
});

const STAGE_CLEAR = Array.from("STAGE CLEAR");

// From the board's 390×844 screen: three bursts above the dialog and three below it, each a beat after
// the last, from as the window opens
const BURSTS = [
    { left: "16.4%", top: "14%", delayMs: 200 },
    { left: "82.1%", top: "11.4%", delayMs: 450 },
    { left: "50.3%", top: "5.2%", delayMs: 700 },
    { left: "14.9%", top: "91.2%", delayMs: 350 },
    { left: "84.6%", top: "88.6%", delayMs: 600 },
    { left: "51.3%", top: "96.2%", delayMs: 900 },
];
</script>
