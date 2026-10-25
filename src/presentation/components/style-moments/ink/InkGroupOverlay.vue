<template>
    <!-- A wet brush stroke sweeps each completed row left to right and each column top to bottom, heavy with
         a blot where it lands and tapering to a split dry tail past the board's edge; a completed box
         gets a vermilion 圓相, left open where it closes. Each is drawn on along its centre line by a mask,
         held and faded by skin.css. Their rough edges are in the paths: no filter. -->
    <span
        v-for="group in effect.groups"
        :key="`${group.kind}-${group.index}`"
        :class="['ink-group-brush absolute', group.kind === 'box' ? 'text-primary' : 'text-foreground']"
        :data-kind="group.kind"
        :style="groupPlacement(group)"
    >
        <svg
            class="absolute overflow-visible"
            :style="SHEETS[group.kind].placement"
            :viewBox="SHEETS[group.kind].viewBox"
            preserveAspectRatio="none"
        >
            <defs>
                <!-- Alpha masks, so the brush's colour does not matter -->
                <mask
                    :id="maskIdOf(group)"
                    style="mask-type: alpha"
                    maskUnits="userSpaceOnUse"
                    v-bind="SHEETS[group.kind].maskArea"
                >
                    <path
                        class="ink-group-reveal"
                        v-bind="SHEETS[group.kind].reveal"
                        fill="none"
                        stroke="currentColor"
                    />
                </mask>
                <radialGradient
                    :id="blotIdOf(group)"
                    v-bind="SHEETS[group.kind].blotFocus"
                >
                    <stop
                        :offset="SHEETS[group.kind].blotSolidTo"
                        stop-color="currentColor"
                    />
                    <stop
                        offset="1"
                        stop-color="currentColor"
                        stop-opacity="0"
                    />
                </radialGradient>
            </defs>
            <g :mask="`url(#${maskIdOf(group)})`">
                <g
                    v-if="group.kind === 'box'"
                    opacity=".8"
                >
                    <g
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                    >
                        <path
                            v-for="arc in CIRCLE_ARCS"
                            :key="arc.d"
                            v-bind="arc"
                        />
                    </g>
                    <circle
                        cx="17.4"
                        cy="82.2"
                        r="7.4"
                        :fill="`url(#${blotIdOf(group)})`"
                    />
                </g>
                <g
                    v-else
                    :transform="group.kind === 'column' ? TURN_DOWN : undefined"
                    fill="currentColor"
                    opacity=".78"
                >
                    <path d="M14 6.8 C 60 6.1, 140 9.9, 220 13.4 C 260 14.9, 290 16.8, 316 17.6 L 332 19.6 L 316 22.5 C 290 23.6, 260 25.5, 220 26.9 C 140 30.4, 60 33.3, 14 33.1 C 6 31.6, 3 24.7, 4 19.5 C 4 13.2, 7 8.1, 14 6.8 Z" />
                    <ellipse
                        cx="15"
                        cy="19.6"
                        rx="12.5"
                        ry="13.2"
                        :fill="`url(#${blotIdOf(group)})`"
                    />
                    <circle
                        cx="6"
                        cy="29"
                        r="2.4"
                    />
                    <circle
                        cx="9"
                        cy="7.6"
                        r="1.6"
                    />
                    <circle
                        cx="27"
                        cy="32.4"
                        r="1.4"
                    />
                    <g
                        opacity=".92"
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                    >
                        <path
                            v-for="hairs in DRY_TAIL"
                            :key="hairs.d"
                            v-bind="hairs"
                        />
                    </g>
                </g>
            </g>
        </svg>
    </span>
</template>

<script lang="ts">
// Counts mounts across instances, so each mount's masks are its own and a new effect never borrows the last one's
let mountCount = 0;
</script>

<script lang="ts" setup>
import type { CompletedGroup, GroupKind } from "@/domain/game/Sudoku";
import type { GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import { groupPlacement } from "@/presentation/components/style-moments/groupPlacement";

defineProps<{
    effect: GroupEffect;
}>();

mountCount += 1;
const mountId = mountCount;
const maskIdOf = (group: CompletedGroup): string => `ink-group-${mountId}-${group.kind}-${group.index}`;
const blotIdOf = (group: CompletedGroup): string => `${maskIdOf(group)}-blot`;

// The canvas's board is 351 wide; a line's stroke is 371 long and starts 10 before the board
const CANVAS_BOARD = 351;
const STROKE_LENGTH = 371;
const STROKE_LEAD = 10;
const percentOfBoard = (length: number): string => `${(length / CANVAS_BOARD) * 100}%`;

// A column's stroke is the row's, turned a quarter down
const TURN_DOWN = "translate(39 0) rotate(90)";
const LINE_REVEAL = { d: "M0 19.5 L 371 19.5", "stroke-width": "44" };
const LINE_MASK_AREA = { x: "-60", y: "-60", width: "500", height: "500" };
const LINE_BLOT = { blotFocus: { cx: ".42", cy: ".5", r: ".5", fx: ".3", fy: ".5" }, blotSolidTo: ".55" };

interface Sheet {
    viewBox: string;
    placement: Record<string, string>;
    maskArea: Record<string, string>;
    reveal: Record<string, string>;
    blotFocus: Record<string, string>;
    blotSolidTo: string;
}

const SHEETS: Record<GroupKind, Sheet> = {
    row: {
        viewBox: "0 0 371 39",
        placement: { left: percentOfBoard(-STROKE_LEAD), top: "0%", width: percentOfBoard(STROKE_LENGTH), height: "100%" },
        maskArea: LINE_MASK_AREA,
        reveal: LINE_REVEAL,
        ...LINE_BLOT,
    },
    column: {
        viewBox: "0 0 39 371",
        placement: { left: "0%", top: percentOfBoard(-STROKE_LEAD), width: "100%", height: percentOfBoard(STROKE_LENGTH) },
        maskArea: LINE_MASK_AREA,
        reveal: { ...LINE_REVEAL, transform: TURN_DOWN },
        ...LINE_BLOT,
    },
    box: {
        viewBox: "0 0 117 117",
        placement: { left: "0%", top: "0%", width: "100%", height: "100%" },
        maskArea: { x: "-40", y: "-40", width: "200", height: "200" },
        reveal: { d: "M17.9 85.9 A 49 49 0 1 1 41.7 104.5", "stroke-width": "22" },
        blotFocus: {},
        blotSolidTo: ".5",
    },
};

// The line's split dry tail: five hairs of the brush, each broken where it ran dry
const DRY_TAIL = [
    { d: "M226 16.2 C 280 15.4, 322 15.2, 366 13.8", "stroke-width": "2.16", "stroke-dasharray": "40 6 22 8 30 10 18" },
    { d: "M224 19.4 C 280 19.2, 330 19.6, 369 19", "stroke-width": "2.84", "stroke-dasharray": "56 5 18 9 26 12 10" },
    { d: "M226 22.6 C 285 22.8, 326 23.2, 362 24.4", "stroke-width": "1.89", "stroke-dasharray": "34 7 28 12 14 10" },
    { d: "M232 13.8 C 270 13.2, 300 12.8, 342 11.8", "stroke-width": "1.35", "stroke-dasharray": "20 8 16 14 12" },
    { d: "M234 25.2 C 270 25.6, 302 26.2, 338 27.4", "stroke-width": "1.35", "stroke-dasharray": "26 10 12 16 8" },
];

// The 圓相: heavy where it lands at the lower left, thinning round the circle, and dry where it closes
const CIRCLE_ARCS = [
    { d: "M17.4 82.2 A 47.5 47.5 0 0 1 24.9 24.9", "stroke-width": "11" },
    { d: "M21.3 27.3 A 48.5 48.5 0 0 1 79.0 14.5", "stroke-width": "8.9" },
    { d: "M75.4 12.0 A 49.5 49.5 0 0 1 107.8 62.8", "stroke-width": "7" },
    { d: "M108.5 58.5 A 50 50 0 0 1 79.6 103.8", "stroke-width": "5.2" },
    { d: "M83.6 98.7 A 47.4 47.4 0 0 1 45.4 104.1", "stroke-width": "1.9", "stroke-dasharray": "10 4 6 7 9", opacity: ".9" },
    { d: "M85.1 101.1 A 50.2 50.2 0 0 1 44.7 106.8", "stroke-width": "2.3", "stroke-dasharray": "14 3 8 6 5", opacity: ".9" },
    { d: "M86.6 103.4 A 53 53 0 0 1 43.9 109.4", "stroke-width": "1.5", "stroke-dasharray": "7 6 10 5", opacity: ".9" },
];
</script>
