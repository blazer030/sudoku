/** The shared shape of a style's pen-written digits (see StrokeDigitWriter). */

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

/** What a stroke digit writer needs of a style: its strokes, and the glyph it writes them over. */
export interface StrokeFace {
    strokes: Partial<Record<number, DigitStrokes>>;
    penWidth: number;
    /** The pen's pace for a stroke that sets none. */
    easing: string;
    /** The board's glyph: its font size, its advance's centre and its baseline, in the board's units. */
    glyph: { size: number; centreX: number; baselineY: number };
    /** The typeface's digit advances, in ems: the digit's box is its advance wide. */
    advances: Partial<Record<number, number>>;
    /** The typeface's baseline in a one-em line box, in ems from its top. */
    baselineEm: number;
    /**
     * Room the skin gives the digit's box on either side of its advance, in ems, so a mask on the box reaches
     * ink that overhangs the advance; none when the box is the advance alone.
     */
    boxPaddingEm?: number;
}
