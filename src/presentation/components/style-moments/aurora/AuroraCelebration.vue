<template>
    <!-- Behind the completion card, on the scrim, which centres the card: three rings of light go out from the card's
         centre and six sparks rise from below, in a column as wide as a phone round the card. skin.css colours and
         moves them; still, one ring stands round the card and no spark rises. -->
    <div
        class="aurora-celebration pointer-events-none absolute inset-0 overflow-hidden"
        :data-still="still ? '' : undefined"
        aria-hidden="true"
    >
        <span
            v-for="(light, index) in rings"
            :key="index"
            class="aurora-celebration-ring absolute top-1/2 left-1/2 -mt-[100px] -ml-[100px] size-[200px] rounded-full border-2 border-solid"
            :data-index="index"
            :data-light="light"
        />
        <div
            v-if="!still"
            class="absolute inset-y-0 left-1/2 -ml-[195px] w-[390px]"
        >
            <span
                v-for="(spark, index) in SPARKS"
                :key="index"
                class="aurora-celebration-spark absolute bottom-10 size-1.5 rounded-full"
                :data-light="index % 2 === 0 ? 'aurora-1' : 'aurora-2'"
                :style="{ left: spark.left, '--aurora-spark-delay': spark.delay }"
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

const props = withDefaults(defineProps<{
    still?: boolean;
}>(), {
    still: false,
});

// The rings by turn, as the canvas's r1, r2 and r3: the primary, then aurora-2, then aurora-1
const RINGS = ["primary", "aurora-2", "aurora-1"] as const;
const rings = computed(() => (props.still ? RINGS.slice(0, 1) : RINGS));

// The canvas's motes across its 390px screen (40, 96, 150, 230, 290 and 340px), each with its own start
const SPARKS = [
    { left: "10.3%", delay: "0.9s" },
    { left: "24.6%", delay: "2.4s" },
    { left: "38.5%", delay: "1.5s" },
    { left: "59%", delay: "3.1s" },
    { left: "74.4%", delay: "1.1s" },
    { left: "87.2%", delay: "2.7s" },
] as const;
</script>
