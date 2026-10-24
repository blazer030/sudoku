/**
 * How paper's pen writes each digit, ported from the stroke-writing board (StrokeWriting.dc.html, the paper
 * row). The paths follow the centre line of Caveat 700's digits in writing order, drawn as the board sets
 * the glyph: 74 units tall, its advance centred on x 50 and its baseline on y 74. They are the mask the
 * real glyph shows through, 11 units wide, so they only need to cover its ink, not match it.
 */

export interface PenStroke {
    path: string;
    /** The path's length, in the board's units: each stroke draws itself on along it. */
    length: number;
    delayMs: number;
    durationMs: number;
    /** The pen's pace; the board's default when none. */
    easing?: string;
    /**
     * Where a later stroke crosses this one, as closed shapes: this stroke is cut there, so the crossing
     * shows only when the pen gets to it the second time.
     */
    crossings?: string;
}

export interface DigitStrokes {
    /** In writing order; a gap between one stroke's end and the next's start is the pen lifting. */
    strokes: PenStroke[];
    /** When the whole mask fades in (60ms), filling the specks the strokes miss; it ends with the last stroke. */
    settleDelayMs: number;
}

export const PEN_EASING = "cubic-bezier(.35,.1,.45,1)";
export const PEN_WIDTH = 11;

/** The board's glyph: its font size, its advance's centre and its baseline, in the board's units. */
export const BOARD_GLYPH = { size: 74, centreX: 50, baselineY: 74 };

// The 8's two crossings, cut from both pieces of its first stroke
const EIGHT_CROSSINGS = "M47.7 47.1 L51.6 51.6 L58.1 59.1 L52 64 L38 64 L38 47.1 Z M52.5 42.9 L56.4 47.4 L62.9 54.9 L65.5 57.9 L75 57.9 L75 40.5 L60 40.5 Z";

// Only 1–9 are ever entered
export const PAPER_DIGIT_STROKES: Partial<Record<number, DigitStrokes>> = {
    1: {
        strokes: [
            { path: "M47 50.5 C 53 46, 59 41.5, 68.5 34.5", length: 28.8, delayMs: 0, durationMs: 148 },
            { path: "M70 35 C 66.5 46, 62.5 60, 59 73.5", length: 42.0, delayMs: 198, durationMs: 222 },
        ],
        settleDelayMs: 360,
    },
    2: {
        strokes: [
            { path: "M48.5 41 C 52 37, 58 34, 63 37 C 67 40, 65 46, 61 50 C 55 57, 48 63, 45 70 C 52 68, 60 66, 67 68.5", length: 81.4, delayMs: 0, durationMs: 460 },
        ],
        settleDelayMs: 400,
    },
    3: {
        strokes: [
            { path: "M50 41 C 56 38, 64 36, 68 40 C 68 45, 60 48, 50 52.5 C 60 53, 69 57, 67 63 C 64 70, 55 73, 45 70", length: 91.8, delayMs: 0, durationMs: 460 },
        ],
        settleDelayMs: 400,
    },
    4: {
        strokes: [
            {
                path: "M59 34 C 55 41, 50 47, 47.5 51 C 47 56, 55 56, 61 53.5",
                length: 38.6,
                delayMs: 0,
                durationMs: 198,
                crossings: "M61 43 L72 43 L72 50.5 L59 50.5 Z M55 57.5 L75 57.5 L75 70 L55 70 Z",
            },
            { path: "M69 38 C 64 48, 60 58, 57 75", length: 41.1, delayMs: 248, durationMs: 212 },
        ],
        settleDelayMs: 400,
    },
    5: {
        strokes: [
            {
                path: "M69 37 C 66 34, 58 34, 54.5 37.5 C 51 42, 49 46, 48.5 49.5 C 57 48.5, 66 51, 66.5 59 C 66.5 67, 59 72.5, 51 72.5 C 47 72.5, 45 71, 44.5 69.5",
                length: 84.5,
                delayMs: 0,
                durationMs: 460,
            },
        ],
        settleDelayMs: 400,
    },
    6: {
        strokes: [
            {
                path: "M68 38.5 C 59 40, 51 46, 47.5 57",
                length: 31.1,
                delayMs: 0,
                durationMs: 152,
                easing: "cubic-bezier(.35,.1,1,1)",
                crossings: "M56 47.5 L57.5 45.5 L72 45.5 L72 60 L52.5 60 L52.8 53 L54 50 Z",
            },
            {
                path: "M47.5 57 C 45 66, 48 72, 54 72.5 C 61 72, 67 64, 67.5 58.5 C 68.5 52, 60 50.5, 53 55",
                length: 61.2,
                delayMs: 152,
                durationMs: 308,
                easing: "cubic-bezier(0,0,.45,1)",
            },
        ],
        settleDelayMs: 400,
    },
    7: {
        strokes: [
            {
                path: "M48.5 38.5 C 55 36, 62 33.5, 69.5 34.5 C 66.5 43, 58 53, 52 63 C 49 68, 47.5 71, 49 75 C 51 76, 53 75, 55.5 73.5",
                length: 77.0,
                delayMs: 0,
                durationMs: 306,
                crossings: "M40 49.5 L56.8 49.5 L51 61 L40 61 Z M65.5 50 L75 50 L75 64 L57.5 64 L59 60 L62 55 Z",
            },
            { path: "M46 55.5 C 53 55, 60 55.5, 66 59", length: 22.6, delayMs: 356, durationMs: 84 },
        ],
        settleDelayMs: 380,
    },
    8: {
        strokes: [
            {
                path: "M66 39 C 62 34, 53 35, 51 40 C 49 46, 54 50, 57 52",
                length: 34.2,
                delayMs: 0,
                durationMs: 154,
                easing: "cubic-bezier(.35,.1,1,1)",
                crossings: EIGHT_CROSSINGS,
            },
            { path: "M57 52 C 61 56, 61 66, 58 72", length: 23.0, delayMs: 154, durationMs: 101, easing: "linear", crossings: EIGHT_CROSSINGS },
            {
                path: "M58 72 C 55 77, 47 78, 45 73 C 43 67, 48 60, 53 56 C 59 52, 68 50, 69 44 C 69.5 40.5, 68 38.5, 66 38",
                length: 65.8,
                delayMs: 255,
                durationMs: 305,
                easing: "cubic-bezier(0,0,.45,1)",
            },
        ],
        settleDelayMs: 500,
    },
    9: {
        strokes: [
            {
                path: "M67.5 35.5 C 62 32, 53 34, 50 42 C 48 49, 53 53, 58 49.5",
                length: 38.7,
                delayMs: 0,
                durationMs: 178,
                easing: "cubic-bezier(.35,.1,1,1)",
                crossings: "M63 40 L75 40 L75 52 L60 52 Z",
            },
            {
                path: "M58 49.5 C 62 46.5, 66 41, 69 37 C 66 48, 62 60, 59 68 C 58 72, 57.5 74, 58 77",
                length: 60.4,
                delayMs: 178,
                durationMs: 282,
                easing: "cubic-bezier(0,0,.45,1)",
            },
        ],
        settleDelayMs: 400,
    },
};

/**
 * Caveat 700's digit advances, in ems (measured in Chromium from the bundled face): the digit's box is
 * its advance wide, so the strokes are scaled to it.
 */
export const CAVEAT_DIGIT_ADVANCES: Partial<Record<number, number>> = {
    1: 0.45, 2: 0.45, 3: 0.45, 4: 0.45, 5: 0.434, 6: 0.471, 7: 0.446, 8: 0.45, 9: 0.438,
};

/** Caveat's baseline in a one-em line box (leading-none), in ems from its top. */
export const CAVEAT_BASELINE_EM = 0.83;
