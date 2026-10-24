<template>
    <!-- Two cyan scan beams shoot from the entered cell to both ends of each completed row or column; an
         outline with yellow corners steps out from the entered cell to each completed box; and each group's
         mono tag (ROW 5 OK, COL 5 OK, BOX 5 OK) sits on its line for a moment. skin.css draws and moves them. -->
    <template
        v-for="group in effect.groups"
        :key="`${group.kind}-${group.index}`"
    >
        <span
            v-if="group.kind === 'box'"
            class="cyber-group-frame absolute z-[3] border"
            :style="{ ...placementOf(group), transformOrigin: growthOriginOf() }"
        />
        <span
            v-else
            :class="['cyber-group-line absolute z-[3]', `cyber-group-${group.kind}`]"
            :style="placementOf(group)"
        >
            <span
                class="cyber-group-beam cyber-group-beam-back absolute"
                :style="beamsOf(group).back"
            >
                <span :class="['cyber-group-beam-line absolute', BEAM_LINES[group.kind].back]" />
            </span>
            <span
                class="cyber-group-beam cyber-group-beam-forward absolute"
                :style="beamsOf(group).forward"
            >
                <span :class="['cyber-group-beam-line absolute', BEAM_LINES[group.kind].forward]" />
            </span>
        </span>
        <span
            :class="['cyber-group-tag absolute z-[4] px-1 py-px text-[10px] leading-[1.2] whitespace-nowrap', { 'cyber-group-tag-box': group.kind === 'box' }]"
            :style="{ ...tagPlacementOf(group), letterSpacing: TAG_TRACKING }"
            aria-hidden="true"
        >{{ labelOf(group) }}</span>
    </template>
</template>

<script lang="ts" setup>
import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import type { CompletedGroup } from "@/domain/game/Sudoku";
import type { GroupEffect } from "@/presentation/components/style-moments/styleMoments";

const props = defineProps<{
    effect: GroupEffect;
}>();

type LineKind = "row" | "column";

// Each beam's 2px line sits on the edge at the entered cell, so it starts from that cell's centre
const BEAM_LINES: Record<LineKind, { back: string; forward: string }> = {
    row: { back: "inset-y-0 -right-px w-0.5", forward: "inset-y-0 -left-px w-0.5" },
    column: { back: "inset-x-0 -bottom-px h-0.5", forward: "inset-x-0 -top-px h-0.5" },
};

const LABELS: Record<CompletedGroup["kind"], string> = { row: "ROW", column: "COL", box: "BOX" };

// The tags are English in both languages, so their tracking is inline: Chinese drops the tracking classes
const TAG_TRACKING = "0.1em";

// The tags sit across a grid line, by half their height
const TAG_HALF_HEIGHT = "7px";

const percent = (cells: number): string => `${(cells / BOARD_SIZE) * 100}%`;

// The first row and column of a box, numbered from the top left
const boxCorner = (index: number): { row: number; column: number } =>
    ({ row: Math.floor(index / BOX_SIZE) * BOX_SIZE, column: (index % BOX_SIZE) * BOX_SIZE });

// Where the group lies on the board, in board percentages
const placementOf = (group: CompletedGroup): Record<string, string> => {
    if (group.kind === "row") return { left: "0%", top: percent(group.index), width: "100%", height: percent(1) };
    if (group.kind === "column") return { left: percent(group.index), top: "0%", width: percent(1), height: "100%" };
    const corner = boxCorner(group.index);
    return { left: percent(corner.column), top: percent(corner.row), width: percent(BOX_SIZE), height: percent(BOX_SIZE) };
};

// A box's outline grows from the entered cell: scaled to a third about this point, it covers that cell
const growthOriginOf = (): string => {
    const { origin } = props.effect;
    return `${(origin.column % BOX_SIZE) * 50}% ${(origin.row % BOX_SIZE) * 50}%`;
};

// Each beam spans from the line's end to the entered cell's centre, and slides its own length outward
const beamsOf = (group: CompletedGroup): { back: Record<string, string>; forward: Record<string, string> } => {
    const centre = (group.kind === "row" ? props.effect.origin.column : props.effect.origin.row) + 0.5;
    const [start, size, crossStart, crossSize] = group.kind === "row" ? ["left", "width", "top", "height"] : ["top", "height", "left", "width"];
    const across = { [crossStart]: "0%", [crossSize]: "100%" };
    return {
        back: { ...across, [start]: "0%", [size]: percent(centre) },
        forward: { ...across, [start]: percent(centre), [size]: percent(BOARD_SIZE - centre) },
    };
};

// The grid line a tag sits on: a line's top, or a box's; the top row's and top boxes' go on their
// lower line, where the board's edge does not cut them
const tagLineOf = (group: CompletedGroup): number => {
    if (group.kind === "row") return group.index === 0 ? 1 : group.index;
    const top = boxCorner(group.index).row;
    return top === 0 ? BOX_SIZE : top;
};

const tagTop = (line: number): string => `calc(${percent(line)} - ${TAG_HALF_HEIGHT})`;

// A box completed with a row holds that row, so a box at the row's head would have the row's tag inside its
// outline, near its own tag: the row's moves to the far end
const boxAtRowHead = (): boolean =>
    props.effect.groups.some(group => group.kind === "box" && boxCorner(group.index).column === 0);

const tagPlacementOf = (group: CompletedGroup): Record<string, string> => {
    if (group.kind === "row") {
        return { top: tagTop(tagLineOf(group)), ...(boxAtRowHead() ? { right: "18px" } : { left: "18px" }) };
    }
    if (group.kind === "column") {
        // Centred under the column near its foot, or held to the board's edge for an edge column
        if (group.index === 0) return { bottom: "18px", left: "2px" };
        if (group.index === BOARD_SIZE - 1) return { bottom: "18px", right: "2px" };
        return { bottom: "18px", left: percent(group.index + 0.5), transform: "translateX(-50%)" };
    }
    return { top: tagTop(tagLineOf(group)), left: `calc(${percent(boxCorner(group.index).column)} + 6px)` };
};

const labelOf = (group: CompletedGroup): string => `${LABELS[group.kind]} ${group.index + 1} OK`;
</script>
