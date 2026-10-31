<template>
    <div
        class="aurora-loader relative flex flex-col items-center gap-[18px] overflow-hidden rounded-[28px] pt-7 px-10 pb-[22px] text-foreground shadow-modal"
        data-skin="card"
    >
        <!-- skin.css turns the halo (four soft lights in a ring) and breathes the nine lights outward from the
             centre; each light's bright colour and its glow are the pseudo-elements, which only fade. Under
             reduced motion the halo holds still and only the centre light stays lit. -->
        <span
            class="aurora-loader-halo pointer-events-none absolute top-[62px] left-1/2 -mt-[75px] -ml-[75px] size-[150px] rounded-full"
            aria-hidden="true"
        />
        <div
            class="relative grid grid-cols-[repeat(3,12px)] gap-3.5 p-2"
            aria-hidden="true"
        >
            <span
                v-for="(ring, position) in RING_BY_POSITION"
                :key="position"
                class="aurora-loader-dot relative block size-3 rounded-full"
                :data-ring="ring"
            />
        </div>
        <p class="aurora-loader-message relative m-0 text-sm font-medium">
            {{ message ?? t("home.generatingPuzzle") }}
        </p>
    </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

withDefaults(defineProps<{
    message?: string;
}>(), {
    message: undefined,
});

// The 3×3 lights by position: the centre breathes first, then the edges, then the corners
const RING_BY_POSITION = ["corner", "edge", "corner", "edge", "centre", "edge", "corner", "edge", "corner"] as const;
</script>
