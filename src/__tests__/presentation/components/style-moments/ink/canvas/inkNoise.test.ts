import { describe, expect, it } from "vitest";
import { INK_NOISE_SIZE, bakeInkNoise } from "@/presentation/components/style-moments/ink/canvas/inkNoise";

const SIZE = 64;
const CHANNELS = { smooth: 0, fine: 1, grain: 2, coarse: 3 } as const;

const valueAt = (noise: Uint8Array, column: number, row: number, channel: number): number =>
    noise[(row * SIZE + column) * 4 + channel] ?? Number.NaN;

// The largest step between neighbouring texels along a row, the wrap from the last column to the first included
const largestStep = (noise: Uint8Array, channel: number): { inside: number; acrossWrap: number } => {
    let inside = 0;
    let acrossWrap = 0;
    for (let row = 0; row < SIZE; row++) {
        for (let column = 0; column < SIZE - 1; column++) {
            inside = Math.max(inside, Math.abs(valueAt(noise, column + 1, row, channel) - valueAt(noise, column, row, channel)));
        }
        acrossWrap = Math.max(acrossWrap, Math.abs(valueAt(noise, 0, row, channel) - valueAt(noise, SIZE - 1, row, channel)));
    }
    return { inside, acrossWrap };
};

describe("bakeInkNoise", () => {
    it("should bake a square RGBA texture, a power of two so it repeats in WebGL1", () => {
        expect(bakeInkNoise(SIZE)).toHaveLength(SIZE * SIZE * 4);
        expect(Math.log2(INK_NOISE_SIZE) % 1).toBe(0);
    });

    it("should bake the same noise every time, so every engine draws the same wash", () => {
        expect(bakeInkNoise(SIZE)).toEqual(bakeInkNoise(SIZE));
    });

    it("should span the full range in every channel", () => {
        const noise = bakeInkNoise(SIZE);
        for (const channel of Object.values(CHANNELS)) {
            const values = Array.from({ length: SIZE * SIZE }, (_, index) => noise[index * 4 + channel] ?? 0);
            expect(Math.min(...values), `channel ${channel}`).toBeLessThan(64);
            expect(Math.max(...values), `channel ${channel}`).toBeGreaterThan(192);
        }
    });

    // Smooth channels change little texel to texel, and as little across the wrap, so repeating shows no seam
    it.each([["smooth", CHANNELS.smooth], ["fine", CHANNELS.fine], ["coarse", CHANNELS.coarse]] as const)(
        "should make the %s channel smooth and seamless",
        (_, channel) => {
            const { inside, acrossWrap } = largestStep(bakeInkNoise(SIZE), channel);

            expect(inside).toBeLessThan(96);
            expect(acrossWrap).toBeLessThanOrEqual(inside);
        },
    );

    it("should make the grain channel change texel to texel, for the paper's tooth", () => {
        expect(largestStep(bakeInkNoise(SIZE), CHANNELS.grain).inside).toBeGreaterThan(160);
    });

    it("should give each channel its own pattern", () => {
        const noise = bakeInkNoise(SIZE);
        const differing = Array.from({ length: SIZE * SIZE }, (_, index) => index)
            .filter(index => Math.abs((noise[index * 4] ?? 0) - (noise[index * 4 + 3] ?? 0)) > 16).length;

        expect(differing).toBeGreaterThan(SIZE * SIZE / 2);
    });
});
