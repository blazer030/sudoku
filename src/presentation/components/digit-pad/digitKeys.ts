import { BOARD_SIZE } from "@/domain/board/constants";

/**
 * What the keypad and the floating pad say about a digit's key. `digitCounts[digit]` is how many of the
 * digit the board holds, indexed from 1 to 9.
 */
export type DigitCounts = readonly number[];

/** Counts for a board that uses no digit up, for pads whose keys never run out (Walkthrough, lessons). */
export const NO_DIGITS_USED_UP: DigitCounts = Array.from({ length: BOARD_SIZE + 1 }, () => 0);

/** How many more of the digit the board takes. */
export const remainingOf = (digitCounts: DigitCounts, digit: number): number => BOARD_SIZE - digitCounts[digit];

/** Whether the board holds all nine of the digit. */
export const isDigitUsedUp = (digitCounts: DigitCounts, digit: number): boolean => remainingOf(digitCounts, digit) <= 0;

/** A key is off once its digit is used up, or when the page rules the digit out. */
export const isDigitKeyDisabled = (digitCounts: DigitCounts, disabledDigits: readonly number[], digit: number): boolean =>
    isDigitUsedUp(digitCounts, digit) || disabledDigits.includes(digit);

/** The message key a digit key is read out by, filling or noting. */
export const digitKeyLabelKey = (noteMode: boolean): string => (noteMode ? "game.digitPad.note" : "game.digitPad.fill");
