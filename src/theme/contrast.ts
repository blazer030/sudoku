// WCAG 2.x contrast and sRGB blending on "#RRGGBB" colours. Relative imports only.

const parseHex = (color: string): [number, number, number] => [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
];

const toHex = (channels: readonly number[]): string =>
    `#${channels.map(channel => Math.round(channel).toString(16).padStart(2, "0")).join("").toUpperCase()}`;

const linearize = (channel: number): number => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (color: string): number => {
    const [red, green, blue] = parseHex(color).map(linearize);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

export const contrastRatio = (foreground: string, background: string): number => {
    const first = relativeLuminance(foreground);
    const second = relativeLuminance(background);
    const lighter = Math.max(first, second);
    const darker = Math.min(first, second);
    return (lighter + 0.05) / (darker + 0.05);
};

/** Paints `color` at `alpha` over an opaque `base`, the way a translucent layer composites in sRGB. */
export const mixColors = (color: string, alpha: number, base: string): string => {
    const top = parseHex(color);
    const bottom = parseHex(base);
    return toHex(top.map((channel, channelIndex) => channel * alpha + bottom[channelIndex] * (1 - alpha)));
};
