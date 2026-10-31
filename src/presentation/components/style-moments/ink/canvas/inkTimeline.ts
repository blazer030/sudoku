// What the ink canvas draws and when, free of WebGL so it can be tested: each effect is placed on the board in
// board fractions (0–1 from the top left) and timed from the moment it is scheduled. The renderer only turns a
// frame's uniforms into pixels.

/** A wash of ink dropped on wet paper: its front runs out from the centre, fast and then slow, and dries. */
export interface InkBloom {
    kind: "bloom";
    centre: { x: number; y: number };
    /** How far the front has spread once the bloom has run, in board widths. */
    radius: number;
    delayMs: number;
    durationMs: number;
}

/** Every effect the ink canvas can play; later ones (a group's stroke, a digit's bleed) join this union. */
export type InkEffect = InkBloom;

export interface ScheduledInkEffect {
    effect: InkEffect;
    scheduledAtMs: number;
}

/** How many blooms the shader draws at once; each takes one vec4 slot. */
export const MAX_BLOOMS = 4;

/** The values one bloom slot carries: its centre, its front's radius and its progress. */
const BLOOM_SLOT_SIZE = 4;

// The solved board: two washes bloom over 1400ms, the second 200ms later and off centre, where the skin's two
// washes stood; the dialog opens as the first settles, while the second is still spreading under the scrim
export const INK_CELEBRATION_WASH: readonly InkBloom[] = [
    { kind: "bloom", centre: { x: 0.5, y: 0.5 }, radius: 0.46, delayMs: 0, durationMs: 1400 },
    { kind: "bloom", centre: { x: 0.7, y: 0.62 }, radius: 0.34, delayMs: 200, durationMs: 1400 },
];

/** How far a bloom has run at `nowMs`: 0 before it starts, 1 once it has, evenly between. */
export const bloomProgress = (bloom: InkBloom, scheduledAtMs: number, nowMs: number): number => {
    const elapsedMs = nowMs - scheduledAtMs - bloom.delayMs;
    return Math.min(Math.max(elapsedMs / bloom.durationMs, 0), 1);
};

/** The wet front spreads by diffusion, its radius growing with the square root of time. */
export const frontRadius = (progress: number, radius: number): number => radius * Math.sqrt(progress);

const endOf = ({ effect, scheduledAtMs }: ScheduledInkEffect): number => scheduledAtMs + effect.delayMs + effect.durationMs;

/** Adds effects from `nowMs` to the ones scheduled, keeping no more blooms than the shader has slots for. */
export const scheduleEffects = (
    scheduled: readonly ScheduledInkEffect[],
    effects: readonly InkEffect[],
    nowMs: number,
): ScheduledInkEffect[] => {
    const all = [...scheduled, ...effects.map(effect => ({ effect, scheduledAtMs: nowMs }))];
    return all.slice(Math.max(all.length - MAX_BLOOMS, 0));
};

/** Whether any effect is still changing at `nowMs`; once none is, the last frame stands and no frame is drawn. */
export const isRunning = (scheduled: readonly ScheduledInkEffect[], nowMs: number): boolean =>
    scheduled.some(effect => nowMs < endOf(effect));

/** The blooms' slots for the shader at `nowMs`: centre x, centre y, front radius and progress each; empty ones all 0. */
export const bloomUniforms = (scheduled: readonly ScheduledInkEffect[], nowMs: number): Float32Array => {
    const uniforms = new Float32Array(MAX_BLOOMS * BLOOM_SLOT_SIZE);
    scheduled.slice(0, MAX_BLOOMS).forEach(({ effect, scheduledAtMs }, slot) => {
        const progress = bloomProgress(effect, scheduledAtMs, nowMs);
        if (progress === 0) return;
        uniforms.set([effect.centre.x, effect.centre.y, frontRadius(progress, effect.radius), progress], slot * BLOOM_SLOT_SIZE);
    });
    return uniforms;
};
