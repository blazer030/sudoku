<template>
    <div
        :style="{ backgroundColor: palette.background }"
        aria-hidden="true"
        class="flex flex-col items-center justify-center gap-1.5 w-full aspect-[3/2] rounded-lg"
        data-testid="style-thumbnail"
    >
        <div class="grid grid-cols-3 gap-0.5 w-2/5">
            <div
                v-for="cell in CELLS"
                :key="cell"
                :style="{ backgroundColor: cell === HIGHLIGHTED_CELL ? palette.highlight : palette.card }"
                class="flex items-center justify-center aspect-square rounded-[2px]"
            >
                <div
                    v-if="cell === MARKED_CELL"
                    :style="{ backgroundColor: palette.primary }"
                    class="size-1 rounded-full"
                />
            </div>
        </div>
        <div
            :style="{ backgroundColor: palette.primary }"
            class="h-1.5 w-2/5 rounded-full"
        />
    </div>
</template>

<script lang="ts" setup>
import type { Palette } from "@/theme/palettes";

defineProps<{ palette: Palette }>();

// A 3×3 mini board: one highlighted cell and one carrying a primary dot
const CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
const HIGHLIGHTED_CELL = 4;
const MARKED_CELL = 2;
</script>
