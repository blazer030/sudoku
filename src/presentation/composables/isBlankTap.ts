// A board with its frame, a page's input area, anything pressable, and every overlay
const NOT_BLANK = "button, a, .fixed, [data-skin~='board'], [data-testid='board-frame'], [data-testid='game-inputs'], [data-testid='walkthrough-inputs'], [data-testid='hint-panel-position']";

/** Whether a tap landed on the blank of a screen with a board: on none of what a player presses or reads. */
export const isBlankTap = (target: EventTarget | null): boolean =>
    target instanceof Element && target.closest(NOT_BLANK) === null;
