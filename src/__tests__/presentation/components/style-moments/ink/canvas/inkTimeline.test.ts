import { describe, expect, it } from "vitest";
import {
    INK_CELEBRATION_WASH,
    MAX_BLOOMS,
    bloomProgress,
    bloomUniforms,
    frontRadius,
    isRunning,
    scheduleEffects,
    type InkBloom,
} from "@/presentation/components/style-moments/ink/canvas/inkTimeline";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";

const BLOOM: InkBloom = { kind: "bloom", centre: { x: 0.5, y: 0.5 }, radius: 0.4, delayMs: 200, durationMs: 1000 };

describe("inkTimeline", () => {
    describe("bloomProgress", () => {
        it("should be nothing before the bloom starts, run evenly through it and hold whole after", () => {
            expect(bloomProgress(BLOOM, 0, 100)).toBe(0);
            expect(bloomProgress(BLOOM, 0, 200)).toBe(0);
            expect(bloomProgress(BLOOM, 0, 700)).toBeCloseTo(0.5);
            expect(bloomProgress(BLOOM, 0, 1200)).toBe(1);
            expect(bloomProgress(BLOOM, 0, 5000)).toBe(1);
        });

        it("should count from the moment the bloom was scheduled", () => {
            expect(bloomProgress(BLOOM, 1000, 1700)).toBeCloseTo(0.5);
        });
    });

    describe("frontRadius", () => {
        // Water spreads through paper by diffusion: the wet front runs out fast, then slows
        it("should grow with the square root of time, fast then slow", () => {
            expect(frontRadius(0, 0.4)).toBe(0);
            expect(frontRadius(0.25, 0.4)).toBeCloseTo(0.2);
            expect(frontRadius(1, 0.4)).toBeCloseTo(0.4);
            const firstQuarterGain = frontRadius(0.25, 1) - frontRadius(0, 1);
            const lastQuarterGain = frontRadius(1, 1) - frontRadius(0.75, 1);
            expect(firstQuarterGain).toBeGreaterThan(3 * lastQuarterGain);
        });
    });

    describe("INK_CELEBRATION_WASH", () => {
        it("should bloom two washes, the second a beat later, off centre and smaller", () => {
            const [first, second] = INK_CELEBRATION_WASH;

            expect(INK_CELEBRATION_WASH).toHaveLength(2);
            expect(first.centre).toEqual({ x: 0.5, y: 0.5 });
            expect(second.delayMs).toBeGreaterThan(first.delayMs);
            expect(second.radius).toBeLessThan(first.radius);
            expect(second.centre.x).toBeGreaterThan(0.5);
        });

        // The dialog opens as the first wash settles, while the second is still spreading under the scrim
        it("should settle the first wash by the time the dialog opens, the second still spreading", () => {
            const boardMs = STYLE_MOMENTS.ink.celebrationBoardMs;
            const [first, second] = INK_CELEBRATION_WASH;

            expect(first.delayMs + first.durationMs).toBeLessThanOrEqual(boardMs);
            expect(second.delayMs + second.durationMs).toBeGreaterThan(boardMs);
        });

        it("should fit the shader's bloom slots", () => {
            expect(INK_CELEBRATION_WASH.length).toBeLessThanOrEqual(MAX_BLOOMS);
        });
    });

    describe("scheduling", () => {
        it("should run until the last effect scheduled has played", () => {
            const scheduled = scheduleEffects([], INK_CELEBRATION_WASH, 1000);
            const endMs = 1000 + Math.max(...INK_CELEBRATION_WASH.map(bloom => bloom.delayMs + bloom.durationMs));

            expect(scheduled).toHaveLength(2);
            expect(isRunning(scheduled, 1000)).toBe(true);
            expect(isRunning(scheduled, endMs - 1)).toBe(true);
            expect(isRunning(scheduled, endMs)).toBe(false);
            expect(isRunning([], 0)).toBe(false);
        });

        it("should add effects to the ones already scheduled, each from its own moment", () => {
            const first = scheduleEffects([], [BLOOM], 0);
            const both = scheduleEffects(first, [BLOOM], 5000);

            expect(both.map(effect => effect.scheduledAtMs)).toEqual([0, 5000]);
            expect(isRunning(first, 3000)).toBe(false);
            expect(isRunning(both, 5500)).toBe(true);
            expect(isRunning(both, 6200)).toBe(false);
        });

        // The shader has a fixed number of slots; the oldest blooms make room for new ones
        it("should keep no more blooms than the shader's slots, dropping the oldest", () => {
            const many = Array.from({ length: MAX_BLOOMS + 2 }, (_, index) => ({ ...BLOOM, radius: index / 10 }));
            const scheduled = scheduleEffects([], many, 0);

            expect(scheduled).toHaveLength(MAX_BLOOMS);
            expect(scheduled[0]?.effect.radius).toBe(0.2);
        });
    });

    describe("bloomUniforms", () => {
        it("should give each slot its bloom's centre, front and progress, and leave the rest empty", () => {
            const scheduled = scheduleEffects([], [BLOOM], 0);
            const uniforms = bloomUniforms(scheduled, 450);

            expect(uniforms).toHaveLength(MAX_BLOOMS * 4);
            expect(uniforms[0]).toBeCloseTo(0.5);
            expect(uniforms[1]).toBeCloseTo(0.5);
            expect(uniforms[2]).toBeCloseTo(frontRadius(0.25, 0.4));
            expect(uniforms[3]).toBeCloseTo(0.25);
            expect([...uniforms.slice(4)].every(value => value === 0)).toBe(true);
        });

        it("should leave a bloom yet to start empty", () => {
            const uniforms = bloomUniforms(scheduleEffects([], [BLOOM], 0), 100);

            expect(uniforms[2]).toBe(0);
            expect(uniforms[3]).toBe(0);
        });
    });
});
