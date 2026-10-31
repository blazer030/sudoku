// The water's noise, baked once into a texture that repeats seamlessly, so the shader reads noise by texture
// lookups rather than hashing (fract(sin()) breaks into blocks at the mediump many phones run fragments at).
// Ink in water has no grain, so every channel is smooth gradient noise: two broad ones that drift and bend the
// washes, and a finer cloud for the density inside them.

/** The texture's side in texels: a power of two, so WebGL1 can repeat it. */
export const INK_NOISE_SIZE = 256;

/** Red and green: the drift across and down; blue: the cloud. */
export const INK_NOISE_CHANNELS = 3;

const SEED = 0x51ab7e;

// Lattice cells across the texture for the broadest octave
const BASE_CELLS = 3;

// mulberry32: a small seeded generator, so every engine bakes the same water
const seededRandom = (seed: number): (() => number) => {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let mixed = state;
        mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
        mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
        return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
};

const quintic = (fraction: number): number => fraction * fraction * fraction * (fraction * (fraction * 6 - 15) + 10);

// Gradient noise on a lattice of `cells` × `cells` that wraps round, sampled at every texel of a `size` square
const gradientNoise = (size: number, cells: number, random: () => number): Float32Array => {
    const angles = Array.from({ length: cells * cells }, () => random() * Math.PI * 2);
    const angleAt = (column: number, row: number): number => angles[(row % cells) * cells + (column % cells)] ?? 0;
    const cellSize = size / cells;
    const values = new Float32Array(size * size);
    for (let row = 0; row < size; row++) {
        const cellRow = Math.floor(row / cellSize);
        const down = row / cellSize - cellRow;
        for (let column = 0; column < size; column++) {
            const cellColumn = Math.floor(column / cellSize);
            const across = column / cellSize - cellColumn;
            const corner = (offsetColumn: number, offsetRow: number): number => {
                const angle = angleAt(cellColumn + offsetColumn, cellRow + offsetRow);
                return Math.cos(angle) * (across - offsetColumn) + Math.sin(angle) * (down - offsetRow);
            };
            const along = quintic(across);
            const top = corner(0, 0) * (1 - along) + corner(1, 0) * along;
            const bottom = corner(0, 1) * (1 - along) + corner(1, 1) * along;
            values[row * size + column] = top + (bottom - top) * quintic(down);
        }
    }
    return values;
};

// Octaves of gradient noise, each twice as fine and half as strong as the last
const fractalNoise = (size: number, octaves: number, random: () => number): Float32Array => {
    const values = new Float32Array(size * size);
    for (let octave = 0; octave < octaves; octave++) {
        const layer = gradientNoise(size, BASE_CELLS << octave, random);
        const amplitude = 0.5 ** octave;
        layer.forEach((value, texel) => { values[texel] = (values[texel] ?? 0) + value * amplitude; });
    }
    return values;
};

// Stretches a channel to the full 0–255, so every channel's contrast is the same whatever the seed gave it
const toBytes = (values: Float32Array): Uint8Array => {
    let lowest = Infinity;
    let highest = -Infinity;
    for (const value of values) {
        lowest = Math.min(lowest, value);
        highest = Math.max(highest, value);
    }
    const span = highest - lowest || 1;
    return Uint8Array.from(values, value => Math.round(((value - lowest) / span) * 255));
};

/**
 * An RGB texture of three smooth noises: red and green broad (two octaves), the drift that bends and carries the
 * washes; blue finer (four octaves), the cloud in their body.
 */
export const bakeInkNoise = (size: number = INK_NOISE_SIZE): Uint8Array => {
    const random = seededRandom(SEED);
    const channels = [fractalNoise(size, 2, random), fractalNoise(size, 2, random), fractalNoise(size, 4, random)].map(toBytes);
    const texels = new Uint8Array(size * size * INK_NOISE_CHANNELS);
    channels.forEach((channel, channelIndex) => {
        channel.forEach((value, texel) => { texels[texel * INK_NOISE_CHANNELS + channelIndex] = value; });
    });
    return texels;
};
