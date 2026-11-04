import { describe, expect, it } from "vitest";
import { INK_NOISE_CHANNELS, INK_NOISE_SIZE, bakeInkNoise } from "@/presentation/components/style-moments/ink/canvas/inkNoise";

const SIZE = 64;
const CHANNELS = { driftAcross: 0, driftDown: 1, cloud: 2 } as const;

const valueAt = (noise: Uint8Array, column: number, row: number, channel: number): number =>
    noise[(row * SIZE + column) * INK_NOISE_CHANNELS + channel] ?? Number.NaN;

// Steps between neighbouring texels along each row: the largest inside, the largest across the wrap, and the mean
const steps = (noise: Uint8Array, channel: number): { inside: number; acrossWrap: number; mean: number } => {
    let inside = 0;
    let acrossWrap = 0;
    let total = 0;
    for (let row = 0; row < SIZE; row++) {
        for (let column = 0; column < SIZE - 1; column++) {
            const step = Math.abs(valueAt(noise, column + 1, row, channel) - valueAt(noise, column, row, channel));
            inside = Math.max(inside, step);
            total += step;
        }
        acrossWrap = Math.max(acrossWrap, Math.abs(valueAt(noise, 0, row, channel) - valueAt(noise, SIZE - 1, row, channel)));
    }
    return { inside, acrossWrap, mean: total / (SIZE * (SIZE - 1)) };
};

describe("bakeInkNoise", () => {
    it("should bake a square RGB texture, a power of two so it repeats in WebGL1", () => {
        expect(INK_NOISE_CHANNELS).toBe(3);
        expect(bakeInkNoise(SIZE)).toHaveLength(SIZE * SIZE * INK_NOISE_CHANNELS);
        expect(Math.log2(INK_NOISE_SIZE) % 1).toBe(0);
    });

    it("should bake the same noise every time, so every engine draws the same wash", () => {
        expect(bakeInkNoise(SIZE)).toEqual(bakeInkNoise(SIZE));
    });

    it("should span the full range in every channel", () => {
        const noise = bakeInkNoise(SIZE);
        for (const channel of Object.values(CHANNELS)) {
            const values = Array.from({ length: SIZE * SIZE }, (_, index) => noise[index * INK_NOISE_CHANNELS + channel] ?? 0);
            expect(Math.min(...values), `channel ${channel}`).toBeLessThan(32);
            expect(Math.max(...values), `channel ${channel}`).toBeGreaterThan(224);
        }
    });

    // Ink in water has no grain: every channel changes gently texel to texel, and as gently across the wrap
    it.each(Object.entries(CHANNELS))("should make the %s channel smooth and seamless", (_, channel) => {
        const { inside, acrossWrap } = steps(bakeInkNoise(SIZE), channel);

        expect(inside).toBeLessThan(48);
        expect(acrossWrap).toBeLessThanOrEqual(inside);
    });

    // The drift that bends the outline is broad; the cloud in the wash's body is finer
    it("should make the cloud finer than the drift", () => {
        const noise = bakeInkNoise(SIZE);

        expect(steps(noise, CHANNELS.cloud).mean).toBeGreaterThan(steps(noise, CHANNELS.driftAcross).mean);
    });

    it("should give each channel its own pattern", () => {
        const noise = bakeInkNoise(SIZE);
        const differing = (first: number, second: number) => Array.from({ length: SIZE * SIZE }, (_, index) => index)
            .filter(index => Math.abs((noise[index * 3 + first] ?? 0) - (noise[index * 3 + second] ?? 0)) > 16).length;

        expect(differing(CHANNELS.driftAcross, CHANNELS.driftDown)).toBeGreaterThan(SIZE * SIZE / 2);
        expect(differing(CHANNELS.driftAcross, CHANNELS.cloud)).toBeGreaterThan(SIZE * SIZE / 2);
    });
});
