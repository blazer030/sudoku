// What the ink canvas draws and when, free of WebGL so it can be tested: each effect is placed on the board in
// board fractions (0–1 from the top left) and timed from the moment it is scheduled. The renderer only turns a
// frame's uniforms into pixels.

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
    { kind: "bloom", centre: { x: 0.5, y: 0.5 }, radius: 0.547, ink: 1, delayMs: 0, durationMs: 1400 },
    // it lands on the first one's wash, so it carries more ink to keep the overlap deep
    { kind: "bloom", centre: { x: 0.7, y: 0.62 }, radius: 0.405, ink: 1.32, delayMs: 200, durationMs: 1400 },
];

/** The slow drift that carries the washes eases to a stop this long after the first effect is scheduled. */
export const INK_DRIFT_SETTLE_MS = 1700;

/** How far a bloom has run at `nowMs`: 0 before it starts, 1 once it has, evenly between. */
export const bloomProgress = (bloom: InkBloom, scheduledAtMs: number, nowMs: number): number => {
    const elapsedMs = nowMs - scheduledAtMs - bloom.delayMs;
    return Math.min(Math.max(elapsedMs / bloom.durationMs, 0), 1);
};

/** The wet front spreads by diffusion, its radius growing with the square root of time. */
export const frontRadius = (progress: number, radius: number): number => radius * Math.sqrt(progress);

// An effect has run once it has played and the water carrying it has settled
const endOf = ({ effect, scheduledAtMs }: ScheduledInkEffect): number =>
    scheduledAtMs + Math.max(effect.delayMs + effect.durationMs, INK_DRIFT_SETTLE_MS);

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

/** What the shader draws one frame from. */
export interface InkFrame {
    /** Each bloom slot's centre, front radius and progress. */
    blooms: Float32Array;
    /** Each bloom slot's ink, 0 for an empty slot. */
    inks: Float32Array;
    /** Seconds since the first effect was scheduled, which times the water's drift. */
    seconds: number;
}

/** The frame at `nowMs`: the blooms' slots, their ink, and the time the water has drifted for. */
export const inkFrame = (scheduled: readonly ScheduledInkEffect[], nowMs: number): InkFrame => {
    const inks = new Float32Array(MAX_BLOOMS);
    scheduled.slice(0, MAX_BLOOMS).forEach(({ effect }, slot) => { inks[slot] = effect.ink; });
    const firstMs = Math.min(...scheduled.map(effect => effect.scheduledAtMs));
    return {
        blooms: bloomUniforms(scheduled, nowMs),
        inks,
        seconds: scheduled.length === 0 ? 0 : Math.max(nowMs - firstMs, 0) / 1000,
    };
};
