// Anything pressable, every overlay, the board, and the areas marked data-tap-area: a board's frame, a row of keys
// with the gaps between them, the Walkthrough's inputs and the hint panel
const NOT_BLANK = "button, a, .fixed, [data-skin~='board'], [data-tap-area]";

/** Whether a tap landed on the blank of a screen with a board: on none of what a player presses or reads. */
export const isBlankTap = (target: EventTarget | null): boolean =>
    target instanceof Element && target.closest(NOT_BLANK) === null;
