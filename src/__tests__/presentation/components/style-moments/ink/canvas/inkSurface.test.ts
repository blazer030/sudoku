import {
    DEFAULT_INK_COLOUR,
    DEFAULT_SEAL_COLOUR,
    MAX_CANVAS_PIXELS,
    canvasPixelSize,
    gridPlacement,
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

        // A box's 圓相 is in the seal's vermilion, the theme's primary
        it("should fall back to the colour it is given, such as the washi seal", () => {
            const [red, green, blue] = DEFAULT_SEAL_COLOUR;

            expect(parseInkColour("", DEFAULT_SEAL_COLOUR)).toEqual(DEFAULT_SEAL_COLOUR);
            expect(red).toBeGreaterThan(green + 0.3);
            expect(red).toBeGreaterThan(blue + 0.3);
        });
    });

    // The canvas covers the whole board; its cells lie inside the board's padding and the grid's border
    describe("gridPlacement", () => {
        it("should place the grid's cells on the canvas in canvas fractions", () => {
            const canvas = { left: 100, top: 200, width: 400, height: 380 };
            const cells = { left: 111, top: 211, width: 378, height: 358 };

            const placement = gridPlacement(canvas, cells);

            expect(placement.x).toBeCloseTo(11 / 400);
            expect(placement.y).toBeCloseTo(11 / 380);
            expect(placement.width).toBeCloseTo(378 / 400);
            expect(placement.height).toBeCloseTo(358 / 380);
        });

        // A canvas not yet laid out places the grid over all of it, never dividing by nothing
        it("should place the grid over the whole canvas while the canvas has no size", () => {
            expect(gridPlacement({ left: 0, top: 0, width: 0, height: 0 }, { left: 0, top: 0, width: 0, height: 0 }))
                .toEqual({ x: 0, y: 0, width: 1, height: 1 });
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
