// What the ink canvas draws and when, free of WebGL so it can be tested: each effect is placed on the board in
// board fractions (0–1 from the top left; a fill or a group mark by its cells) and timed from the moment it is
// scheduled. The renderer only turns a frame's uniforms into pixels.
import type { HouseKind } from "@/domain/board/geometry";
import type { CompletedGroup } from "@/domain/game/Sudoku";

/** A wash of ink dropped on wet paper: its front runs out from the centre, fast and then slow, and dries. */
export interface InkBloom {
    kind: "bloom";
    centre: { x: number; y: number };
    /** How far the front has spread once the bloom has run, in board widths. */
    radius: number;
    /** How much ink the drop carries, a lone drop's being 1. */
    ink: number;
    delayMs: number;
    durationMs: number;
}

/** A drop of ink landing under a digit as it is entered, soaking out and fading as the digit settles. */
export interface InkFill {
    kind: "fill";
    /** The cell the digit was entered in, counted from 0. */
    cell: { row: number; column: number };
    /** Shapes the drop's outline, so no two drops are alike. */
    seed: number;
}

/** A completed group's mark: a wet brush stroke along a row or a column, or a vermilion 圓相 round a box. */
export interface InkGroupMark {
    kind: "group";
    group: CompletedGroup;
    /** Shapes the stroke's wobble and edge. */
    seed: number;
}

/** Every effect the ink canvas can play. */
export type InkEffect = InkBloom | InkFill | InkGroupMark;

export interface ScheduledInkEffect {
    effect: InkEffect;
    scheduledAtMs: number;
}

/** How many blooms the shader draws at once; each takes one vec4 slot. */
export const MAX_BLOOMS = 4;

/** The values one bloom slot carries: its centre, its front's radius and its progress. */
const BLOOM_SLOT_SIZE = 4;

/** How many fills the shader draws at once; each takes one vec4 slot. */
export const MAX_FILLS = 8;

/** The values one fill slot carries: its centre, its age in seconds (negative for none) and its seed. */
const FILL_SLOT_SIZE = 4;

/** How long a fill's drop shows: it lands, soaks out and has faded as the digit settles. */
export const INK_FILL_MS = 1000;

/** How many group marks the shader draws at once; each takes one vec4 slot. */
export const MAX_GROUPS = 4;

/** The values one group slot carries: its kind's code (negative for none), its index, its age in seconds and its seed. */
const GROUP_SLOT_SIZE = 4;

/** How long each kind's mark shows: a line's stroke from 80ms, a box's 圓相 from 160ms, each drawn on, held and faded. */
export const INK_GROUP_MS: Readonly<Record<HouseKind, number>> = { row: 1080, column: 1080, box: 1220 };

/** The shader's code for each kind of group. */
const GROUP_KIND_CODES: Readonly<Record<HouseKind, number>> = { row: 0, column: 1, box: 2 };

/** The cells a row, column or box spans. */
const BOARD_CELLS = 9;

// The solved board: two washes bloom over 1400ms, the second 200ms later and off centre, where the skin's two
// washes stood; the dialog opens as the first settles, while the second is still spreading under the scrim
export const INK_CELEBRATION_WASH: readonly InkBloom[] = [
    { kind: "bloom", centre: { x: 0.5, y: 0.5 }, radius: 0.547, ink: 1, delayMs: 0, durationMs: 1400 },
    // it lands on the first one's wash, so it carries more ink to keep the overlap deep
    { kind: "bloom", centre: { x: 0.7, y: 0.62 }, radius: 0.405, ink: 1.32, delayMs: 200, durationMs: 1400 },
];

/** The slow drift that carries the washes eases to a stop this long after the first effect is scheduled. */
export const INK_DRIFT_SETTLE_MS = 1700;

// A seed from 0 to 7 by the golden ratio, so neighbouring numbers give far-apart seeds
const seedOf = (number: number): number => ((number * 0.6180339) % 1) * 7;

/** The drop under a digit entered in `cell` at `nowMs`, shaped by its cell and its moment. */
export const inkFillAt = (cell: { row: number; column: number }, nowMs: number): InkFill =>
    ({ kind: "fill", cell, seed: seedOf(cell.row * BOARD_CELLS + cell.column + nowMs) });

/** The marks of completed groups, each shaped by its kind and index. */
export const inkGroupMarks = (groups: readonly CompletedGroup[]): InkGroupMark[] =>
    groups.map(group => ({ kind: "group", group, seed: seedOf(group.index * 3 + GROUP_KIND_CODES[group.kind]) }));

/** How far a bloom has run at `nowMs`: 0 before it starts, 1 once it has, evenly between. */
export const bloomProgress = (bloom: InkBloom, scheduledAtMs: number, nowMs: number): number => {
    const elapsedMs = nowMs - scheduledAtMs - bloom.delayMs;
    return Math.min(Math.max(elapsedMs / bloom.durationMs, 0), 1);
};

/** The wet front spreads by diffusion, its radius growing with the square root of time. */
export const frontRadius = (progress: number, radius: number): number => radius * Math.sqrt(progress);

// A bloom has run once it has played and the water carrying it has settled; a fill or a mark once it has faded
const runMsOf = (effect: InkEffect): number => {
    if (effect.kind === "bloom") return Math.max(effect.delayMs + effect.durationMs, INK_DRIFT_SETTLE_MS);
    if (effect.kind === "fill") return INK_FILL_MS;
    return INK_GROUP_MS[effect.group.kind];
};

const endOf = ({ effect, scheduledAtMs }: ScheduledInkEffect): number => scheduledAtMs + runMsOf(effect);

const SLOTS: Record<InkEffect["kind"], number> = { bloom: MAX_BLOOMS, fill: MAX_FILLS, group: MAX_GROUPS };

interface Scheduled<Kind extends InkEffect["kind"]> {
    effect: Extract<InkEffect, { kind: Kind }>;
    scheduledAtMs: number;
}

const scheduledOf = <Kind extends InkEffect["kind"]>(scheduled: readonly ScheduledInkEffect[], kind: Kind): Scheduled<Kind>[] =>
    scheduled.filter((entry): entry is Scheduled<Kind> => entry.effect.kind === kind);

/**
 * Adds effects from `nowMs` to the ones scheduled, keeping of each kind no more than the shader has slots
 * for: the oldest of that kind make room.
 */
export const scheduleEffects = (
    scheduled: readonly ScheduledInkEffect[],
    effects: readonly InkEffect[],
    nowMs: number,
): ScheduledInkEffect[] => {
    const all = [...scheduled, ...effects.map(effect => ({ effect, scheduledAtMs: nowMs }))];
    const kept = new Set((Object.keys(SLOTS) as InkEffect["kind"][]).flatMap((kind) => {
        const ofKind = all.filter(entry => entry.effect.kind === kind);
        return ofKind.slice(Math.max(ofKind.length - SLOTS[kind], 0));
    }));
    return all.filter(entry => kept.has(entry));
};

/** Whether any effect is still changing at `nowMs`; once none is, the last frame stands and no frame is drawn. */
export const isRunning = (scheduled: readonly ScheduledInkEffect[], nowMs: number): boolean =>
    scheduled.some(effect => nowMs < endOf(effect));

/** The blooms' slots for the shader at `nowMs`: centre x, centre y, front radius and progress each; empty ones all 0. */
export const bloomUniforms = (scheduled: readonly ScheduledInkEffect[], nowMs: number): Float32Array => {
    const uniforms = new Float32Array(MAX_BLOOMS * BLOOM_SLOT_SIZE);
    scheduledOf(scheduled, "bloom").forEach(({ effect, scheduledAtMs }, slot) => {
        const progress = bloomProgress(effect, scheduledAtMs, nowMs);
        if (progress === 0) return;
        uniforms.set([effect.centre.x, effect.centre.y, frontRadius(progress, effect.radius), progress], slot * BLOOM_SLOT_SIZE);
    });
    return uniforms;
};

/**
 * The fills' slots for the shader at `nowMs`: their cell's centre in grid fractions (0–1 from the top left),
 * their age in seconds and their seed; an empty slot's age is -1.
 */
export const fillUniforms = (scheduled: readonly ScheduledInkEffect[], nowMs: number): Float32Array => {
    const uniforms = new Float32Array(MAX_FILLS * FILL_SLOT_SIZE);
    for (let slot = 0; slot < MAX_FILLS; slot++) uniforms[slot * FILL_SLOT_SIZE + 2] = -1;
    scheduledOf(scheduled, "fill").forEach(({ effect, scheduledAtMs }, slot) => {
        uniforms.set([
            (effect.cell.column + 0.5) / BOARD_CELLS,
            (effect.cell.row + 0.5) / BOARD_CELLS,
            (nowMs - scheduledAtMs) / 1000,
            effect.seed,
        ], slot * FILL_SLOT_SIZE);
    });
    return uniforms;
};

/**
 * The group marks' slots for the shader at `nowMs`: their kind's code (0 row, 1 column, 2 box), their index,
 * their age in seconds and their seed; an empty slot is all -1.
 */
export const groupUniforms = (scheduled: readonly ScheduledInkEffect[], nowMs: number): Float32Array => {
    const uniforms = new Float32Array(MAX_GROUPS * GROUP_SLOT_SIZE).fill(-1);
    scheduledOf(scheduled, "group").forEach(({ effect, scheduledAtMs }, slot) => {
        uniforms.set([
            GROUP_KIND_CODES[effect.group.kind],
            effect.group.index,
            (nowMs - scheduledAtMs) / 1000,
            effect.seed,
        ], slot * GROUP_SLOT_SIZE);
    });
    return uniforms;
};

/** What the shader draws one frame from. */
export interface InkFrame {
    /** Each bloom slot's centre, front radius and progress. */
    blooms: Float32Array;
    /** Each bloom slot's ink, 0 for an empty slot. */
    inks: Float32Array;
    /** Each fill slot's centre, age and seed. */
    fills: Float32Array;
    /** Each group slot's kind, index, age and seed. */
    groups: Float32Array;
    /** Seconds since the first bloom was scheduled, which times the water's drift. */
    seconds: number;
}

/** The frame at `nowMs`: every effect's slots, the blooms' ink, and the time the water has drifted for. */
export const inkFrame = (scheduled: readonly ScheduledInkEffect[], nowMs: number): InkFrame => {
    const blooms = scheduledOf(scheduled, "bloom");
    const inks = new Float32Array(MAX_BLOOMS);
    blooms.forEach(({ effect }, slot) => { inks[slot] = effect.ink; });
    const firstMs = Math.min(...blooms.map(bloom => bloom.scheduledAtMs));
    return {
        blooms: bloomUniforms(scheduled, nowMs),
        inks,
        fills: fillUniforms(scheduled, nowMs),
        groups: groupUniforms(scheduled, nowMs),
        seconds: blooms.length === 0 ? 0 : Math.max(nowMs - firstMs, 0) / 1000,
    };
};
