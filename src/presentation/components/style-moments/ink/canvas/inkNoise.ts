// The paper's noise, baked once into a texture that repeats seamlessly, so the shader reads noise by texture
// lookups rather than hashing (fract(sin()) breaks into blocks at the mediump many phones run fragments at).

/** The texture's side in texels: a power of two, so WebGL1 can repeat it. */
export const INK_NOISE_SIZE = 256;

const SEED = 0x1d4b5e;

// mulberry32: a small seeded generator, so every engine bakes the same paper
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

const smoothstep = (fraction: number): number => fraction * fraction * (3 - 2 * fraction);

// Value noise on a lattice of `cells` × `cells` that wraps round, sampled at every texel of a `size` square
const latticeNoise = (size: number, cells: number, random: () => number): Float32Array => {
    const lattice = Array.from({ length: cells * cells }, random);
    const latticeAt = (column: number, row: number): number => lattice[(row % cells) * cells + (column % cells)] ?? 0;
    const cellSize = size / cells;
    const values = new Float32Array(size * size);
    for (let row = 0; row < size; row++) {
        const cellRow = Math.floor(row / cellSize);
        const across = smoothstep(row / cellSize - cellRow);
        for (let column = 0; column < size; column++) {
            const cellColumn = Math.floor(column / cellSize);
            const along = smoothstep(column / cellSize - cellColumn);
            const top = latticeAt(cellColumn, cellRow) * (1 - along) + latticeAt(cellColumn + 1, cellRow) * along;
            const bottom = latticeAt(cellColumn, cellRow + 1) * (1 - along) + latticeAt(cellColumn + 1, cellRow + 1) * along;
            values[row * size + column] = top * (1 - across) + bottom * across;
        }
    }
    return values;
};

const whiteNoise = (size: number, random: () => number): Float32Array => Float32Array.from({ length: size * size }, random);

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
 * An RGBA texture of four noises: red smooth (a cell every 8 texels), green fine (every 4, the paper's fibres),
 * blue per texel (the paper's tooth, where pigment granulates) and alpha coarse (every 16, the wash's body).
 */
export const bakeInkNoise = (size: number = INK_NOISE_SIZE): Uint8Array => {
    const random = seededRandom(SEED);
    const channels = [
        latticeNoise(size, size / 8, random),
        latticeNoise(size, size / 4, random),
        whiteNoise(size, random),
        latticeNoise(size, size / 16, random),
    ].map(toBytes);
    const texels = new Uint8Array(size * size * 4);
    channels.forEach((channel, channelIndex) => {
        channel.forEach((value, texel) => { texels[texel * 4 + channelIndex] = value; });
    });
    return texels;
};
