import { describe, expect, it } from "vitest";
import {
    DEFAULT_INK_COLOUR,
    MAX_CANVAS_PIXELS,
    canvasPixelSize,
    inkCanvasForcedOff,
    parseInkColour,
} from "@/presentation/components/style-moments/ink/canvas/inkSurface";

describe("inkSurface", () => {
    describe("canvasPixelSize", () => {
        // Ink is soft: three quarters of the screen's pixels are plenty, and cheaper to shade
        it("should render at three quarters of the device's pixel ratio", () => {
            expect(canvasPixelSize(360, 352, 2)).toEqual({ width: 540, height: 528 });
            expect(canvasPixelSize(360, 360, 3)).toEqual({ width: 810, height: 810 });
            expect(canvasPixelSize(400, 400, 1)).toEqual({ width: 300, height: 300 });
        });

        it("should keep a tablet's board within the pixel budget, in its own proportions", () => {
            expect(canvasPixelSize(900, 450, 3)).toEqual({ width: MAX_CANVAS_PIXELS, height: MAX_CANVAS_PIXELS / 2 });
        });

        it("should never size the canvas to nothing", () => {
            expect(canvasPixelSize(0, 0, 2)).toEqual({ width: 1, height: 1 });
        });
    });

    describe("parseInkColour", () => {
        it("should read a hex colour into the shader's 0–1 channels", () => {
            const [red, green, blue] = parseInkColour("#1E1B16");

            expect(red).toBeCloseTo(0x1e / 255);
            expect(green).toBeCloseTo(0x1b / 255);
            expect(blue).toBeCloseTo(0x16 / 255);
        });

        it("should read a short hex colour and ignore spaces round it", () => {
            expect(parseInkColour(" #fff ")).toEqual([1, 1, 1]);
        });

        it("should fall back to the washi ink for anything else", () => {
            expect(parseInkColour("oklch(0.2 0.01 80)")).toEqual(DEFAULT_INK_COLOUR);
            expect(parseInkColour("")).toEqual(DEFAULT_INK_COLOUR);
        });
    });

    // A dev-only switch to compare the canvas with the skin's washes; production never reads the query
    describe("inkCanvasForcedOff", () => {
        it("should switch the canvas off by the query in development", () => {
            expect(inkCanvasForcedOff("?inkCanvas=off", true)).toBe(true);
            expect(inkCanvasForcedOff("?difficulty=easy&inkCanvas=off", true)).toBe(true);
        });

        it("should leave the canvas on without the query", () => {
            expect(inkCanvasForcedOff("", true)).toBe(false);
            expect(inkCanvasForcedOff("?inkCanvas=on", true)).toBe(false);
        });

        it("should never switch it off outside development", () => {
            expect(inkCanvasForcedOff("?inkCanvas=off", false)).toBe(false);
        });
    });
});
