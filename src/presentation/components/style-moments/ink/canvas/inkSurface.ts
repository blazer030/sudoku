import { getPalette } from "@/theme/palettes";

// The ink canvas's surface: how many pixels it renders, the ink it draws in, and the dev-only switch that
// leaves the skin's CSS washes in its place for comparison.

/** The canvas's largest side in pixels; a tablet's board at a high pixel ratio gains nothing past it. */
export const MAX_CANVAS_PIXELS = 1024;

/** Ink is soft, so three quarters of the screen's pixels draw it as well, for little more than half the shading. */
const PIXEL_RATIO_SCALE = 0.75;


/** The drawing buffer's size for a canvas of `cssWidth` × `cssHeight`, its longer side within the budget. */
export const canvasPixelSize = (cssWidth: number, cssHeight: number, devicePixelRatio: number): { width: number; height: number } => {
    const scale = Math.min(devicePixelRatio * PIXEL_RATIO_SCALE, MAX_CANVAS_PIXELS / Math.max(cssWidth, cssHeight, 1));
    return {
        width: Math.max(Math.round(cssWidth * scale), 1),
        height: Math.max(Math.round(cssHeight * scale), 1),
    };
};

type InkColour = readonly [number, number, number];

/** Where the grid's cells lie on the canvas, in canvas fractions from its top left. */
export interface GridPlacement {
    x: number;
    y: number;
    width: number;
    height: number;
}

const parseHex = (colour: string): InkColour | null => {
    const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(colour.trim())?.[1];
    if (hex === undefined) return null;
    const full = hex.length === 3 ? hex.replace(/./g, "$&$&") : hex;
    const channel = (offset: number): number => Number.parseInt(full.slice(offset, offset + 2), 16) / 255;
    return [channel(0), channel(2), channel(4)];
};

/** The washi palette's ink, for a foreground the canvas cannot read. */
export const DEFAULT_INK_COLOUR: InkColour = parseHex(getPalette("ink", "vermilion", "light").foreground) ?? [0, 0, 0];

/** The washi palette's seal, the vermilion of a box's 圓相, for a primary the canvas cannot read. */
export const DEFAULT_SEAL_COLOUR: InkColour = parseHex(getPalette("ink", "vermilion", "light").primary) ?? [0.7, 0.15, 0.12];

/**
 * Reads a theme colour such as `--color-foreground` (a hex colour, as the theme sheet writes it) into the
 * shader's 0–1 channels, or gives `fallback` for one it cannot read.
 */
export const parseInkColour = (colour: string, fallback: InkColour = DEFAULT_INK_COLOUR): InkColour => parseHex(colour) ?? fallback;

/** `?inkCanvas=off` leaves the skin's washes in the canvas's place, in development only. */
export const inkCanvasForcedOff = (search: string, isDevelopment: boolean): boolean =>
    isDevelopment && new URLSearchParams(search).get("inkCanvas") === "off";
