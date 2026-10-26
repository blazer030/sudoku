/**
 * How chalk writes each digit, ported from the stroke-writing board (StrokeWriting.dc.html, the 黑板 row; 白板
 * writes the same strokes with a marker). The paths follow the centre line of Caveat Brush's digits in writing
 * order, drawn as the board sets the glyph: 74 units tall, its advance centred on x 50 and its baseline on
 * y 74. They are the mask the real glyph shows through, 14 units wide, so they only need to cover its ink.
 * The pen lifts for 50ms between strokes, and the whole mask settles in over the last 60ms.
 */

import type { DigitStrokes, StrokeFace } from "@/presentation/components/style-moments/digitStrokes";

const PEN_EASING = "cubic-bezier(.35,.1,.45,1)";
// A stroke that runs on into the next piece without a lift keeps its speed through the join
const INTO_NEXT_PIECE = "cubic-bezier(.35,.1,1,1)";
const FROM_LAST_PIECE = "cubic-bezier(0,0,.45,1)";

// The 8's two crossings, cut from both pieces of its first loop
const EIGHT_CROSSINGS = "M43.5 49.5 L53.5 59.5 L47 64 L36 57 L38 50 Z M50.5 42.5 L60.5 52.5 L70 52.5 L70 36 L56 36 Z";

// Only 1–9 are ever entered
const CHALKBOARD_DIGIT_STROKES: Partial<Record<number, DigitStrokes>> = {
    1: {
        strokes: [
            { path: "M39.5 45 C 44 41, 49 34, 54 29", length: 23.6, delayMs: 0, durationMs: 124 },
            { path: "M54.5 29 C 54 45, 53 60, 52 72", length: 45.1, delayMs: 174, durationMs: 246 },
        ],
        settleDelayMs: 360,
    },
    2: {
        strokes: [
            { path: "M39.5 41 C 41 33, 47 28, 52 28.5 C 59 30, 60 38, 56 46 C 51 55, 44 62, 40 69.5 C 47 71, 55 70.5, 61 72", length: 91.8, delayMs: 0, durationMs: 460 },
        ],
        settleDelayMs: 400,
    },
    3: {
        strokes: [
            { path: "M41.5 33 C 47 30.5, 57 29, 58.5 34 C 59 40, 52 46, 46 51 C 55 50, 61 54, 60 61 C 58 69, 50 73, 41 69", length: 86.6, delayMs: 0, durationMs: 460 },
        ],
        settleDelayMs: 400,
    },
    4: {
        strokes: [
            {
                path: "M51 28 C 46 36, 41 47, 37 57.5 C 45 55, 55 53.5, 64 55.5",
                length: 62.1,
                delayMs: 0,
                durationMs: 234,
                crossings: "M50 40 L61 40 L61 50.5 L50 50.5 Z M49 60.5 L61 60.5 L61 75 L49 75 Z",
            },
            { path: "M56 30 C 55 45, 54 60, 54 75", length: 47.1, delayMs: 284, durationMs: 176 },
        ],
        settleDelayMs: 400,
    },
    5: {
        strokes: [
            { path: "M42.5 30.5 C 41.5 37, 40.5 43, 40 49 C 48 47, 58 47, 62 54 C 63 62, 50 69, 38.5 71", length: 76.1, delayMs: 0, durationMs: 319 },
            { path: "M42.5 30 C 49 29.5, 57 28.5, 63.5 30.5", length: 23.1, delayMs: 369, durationMs: 91 },
        ],
        settleDelayMs: 400,
    },
    6: {
        strokes: [
            {
                path: "M55.5 29.5 C 48 35, 42 46, 39 57",
                length: 34.6,
                delayMs: 0,
                durationMs: 148,
                easing: INTO_NEXT_PIECE,
                crossings: "M48 46 L62 46 L62 62 L44.5 62 L45.5 55 Z",
            },
            {
                path: "M39 57 C 37.5 68, 40 75.5, 45.5 76.5 C 52 77, 59 68, 60 59 C 60.5 51, 53 47, 45 55",
                length: 70.9,
                delayMs: 148,
                durationMs: 312,
                easing: FROM_LAST_PIECE,
            },
        ],
        settleDelayMs: 400,
    },
    7: {
        strokes: [
            { path: "M34 30.5 C 42 31, 51 30.5, 60 32.5 C 56 40, 51 48, 48.5 57 C 46.5 64, 45 69, 45 74.5", length: 73.2, delayMs: 0, durationMs: 440 },
        ],
        settleDelayMs: 380,
    },
    8: {
        strokes: [
            {
                path: "M61 31 C 57 26, 48 27, 45 33 C 43 40, 47 46, 51 50",
                length: 39.9,
                delayMs: 0,
                durationMs: 158,
                easing: INTO_NEXT_PIECE,
                crossings: EIGHT_CROSSINGS,
            },
            { path: "M51 50 C 57 56, 60 64, 58 71", length: 25.2, delayMs: 158, durationMs: 97, easing: "linear", crossings: EIGHT_CROSSINGS },
            {
                path: "M58 71 C 56 77, 46 79, 41 75 C 36 70, 40 60, 46 55 C 52 50, 60 44, 61.5 37 C 62 34, 61.5 32, 61 31",
                length: 75.0,
                delayMs: 255,
                durationMs: 305,
                easing: FROM_LAST_PIECE,
            },
        ],
        settleDelayMs: 500,
    },
    9: {
        strokes: [
            {
                path: "M60 29.5 C 52 28, 44 36, 41 46 C 39 54, 43 57.5, 49 56.5",
                length: 45.9,
                delayMs: 0,
                durationMs: 163,
                easing: INTO_NEXT_PIECE,
                crossings: "M56 35 L70 35 L70 50 L55 50 Z M52 57 L70 50.5 L70 80 L46 80 L49.5 62 Z",
            },
            {
                path: "M49 56.5 C 55 55.5, 60 49, 62 38",
                length: 26.0,
                delayMs: 163,
                durationMs: 89,
                easing: "linear",
                crossings: "M52 57.5 L70 57.5 L70 80 L46 80 L49.5 62 Z",
            },
            { path: "M62 38 C 62.5 35, 62.5 32, 61.5 30 C 62.5 45, 58 62, 50 76", length: 58.2, delayMs: 252, durationMs: 208, easing: FROM_LAST_PIECE },
        ],
        settleDelayMs: 400,
    },
};

/** Where the board's chalk drops dust as a stroke ends, and when: 20ms before the pen lifts. */
export interface DustFall {
    x: number;
    y: number;
    delayMs: number;
}

/** Each fall is three specks, from the first (at the fall's point) down and to the right. */
export const DUST_SPECKS: readonly { dx: number; dy: number; radius: number }[] = [
    { dx: 0, dy: 0, radius: 1.1 },
    { dx: 4.5, dy: 1.5, radius: 0.9 },
    { dx: 2, dy: 4, radius: 0.8 },
];

/** One fall at the end of each of the digit's pen strokes, in the board's units. */
export const CHALKBOARD_DIGIT_DUST: Partial<Record<number, DustFall[]>> = {
    1: [{ x: 52, y: 33, delayMs: 104 }, { x: 50, y: 76, delayMs: 400 }],
    2: [{ x: 59, y: 76, delayMs: 440 }],
    3: [{ x: 39, y: 73, delayMs: 440 }],
    4: [{ x: 62, y: 59.5, delayMs: 214 }, { x: 52, y: 79, delayMs: 440 }],
    5: [{ x: 36.5, y: 75, delayMs: 299 }, { x: 61.5, y: 34.5, delayMs: 440 }],
    6: [{ x: 43, y: 59, delayMs: 440 }],
    7: [{ x: 43, y: 78.5, delayMs: 420 }],
    8: [{ x: 59, y: 35, delayMs: 540 }],
    9: [{ x: 48, y: 80, delayMs: 440 }],
};

/**
 * Caveat Brush's digit advances, in ems (from the bundled face's hmtx; digitCentring.test.ts checks them):
 * the digit's box is its advance wide, so the strokes are scaled to it.
 */
const CAVEAT_BRUSH_DIGIT_ADVANCES: Partial<Record<number, number>> = {
    1: 0.348, 2: 0.416, 3: 0.426, 4: 0.46, 5: 0.44, 6: 0.47, 7: 0.394, 8: 0.454, 9: 0.462,
};

/**
 * The room skin.css gives a board digit either side of its advance (padding, taken back by a negative
 * margin): Caveat Brush's ink overhangs its advance (the 4's bar by about 0.07em), and the grain mask
 * clips to the digit's box.
 */
const DIGIT_ROOM_EM = 0.1;

export const CHALKBOARD_STROKE_FACE: StrokeFace = {
    strokes: CHALKBOARD_DIGIT_STROKES,
    penWidth: 14,
    easing: PEN_EASING,
    glyph: { size: 74, centreX: 50, baselineY: 74 },
    advances: CAVEAT_BRUSH_DIGIT_ADVANCES,
    // Caveat Brush's ascent and descent (0.96em and 0.3em) centred on a one-em line
    baselineEm: 0.83,
    boxPaddingEm: DIGIT_ROOM_EM,
};
