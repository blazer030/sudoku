import { getPalette } from "@/theme/palettes";

// The ink canvas's surface: how many pixels it renders, the ink it draws in, and the dev-only switch that
// leaves the skin's CSS washes in its place for comparison.

/** The canvas's largest side in pixels; a tablet's board at a high pixel ratio gains nothing past it. */
export const MAX_CANVAS_PIXELS = 1024;

/** Ink is soft, so three quarters of the screen's pixels draw it as well, for little more than half the shading. */
const PIXEL_RATIO_SCALE = 0.75;


export const canvasPixelSize = (cssPixels: number, devicePixelRatio: number): number =>
    Math.min(Math.max(Math.round(cssPixels * devicePixelRatio * PIXEL_RATIO_SCALE), 1), MAX_CANVAS_PIXELS);

type InkColour = readonly [number, number, number];

const parseHex = (colour: string): InkColour | null => {
    const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(colour.trim())?.[1];
    if (hex === undefined) return null;
    const full = hex.length === 3 ? hex.replace(/./g, "$&$&") : hex;
    const channel = (offset: number): number => Number.parseInt(full.slice(offset, offset + 2), 16) / 255;
    return [channel(0), channel(2), channel(4)];
};

/** The washi palette's ink, for a foreground the canvas cannot read. */
export const DEFAULT_INK_COLOUR: InkColour = parseHex(getPalette("ink", "vermilion", "light").foreground) ?? [0, 0, 0];

/** Reads `--color-foreground` (a hex colour, as the theme sheet writes it) into the shader's 0–1 channels. */
export const parseInkColour = (colour: string): InkColour => parseHex(colour) ?? DEFAULT_INK_COLOUR;

/** `?inkCanvas=off` leaves the skin's washes in the canvas's place, in development only. */
export const inkCanvasForcedOff = (search: string, isDevelopment: boolean): boolean =>
    isDevelopment && new URLSearchParams(search).get("inkCanvas") === "off";
