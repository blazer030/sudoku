import { NO_DIGITS_USED_UP, isDigitKeyDisabled, isDigitUsedUp, remainingOf } from "@/presentation/components/digit-pad/digitKeys";

const countsWith = (digit: number, count: number): number[] => NO_DIGITS_USED_UP.map((each, index) => (index === digit ? count : each));

describe("digitKeys", () => {
    it("should count what is left of a digit, and call it used up at nine", () => {
        expect(remainingOf(countsWith(4, 7), 4)).toBe(2);
        expect(isDigitUsedUp(countsWith(4, 8), 4)).toBe(false);
        expect(isDigitUsedUp(countsWith(4, 9), 4)).toBe(true);
    });

    it("should turn a key off when its digit is used up or ruled out", () => {
        expect(isDigitKeyDisabled(countsWith(2, 9), [], 2)).toBe(true);
        expect(isDigitKeyDisabled(NO_DIGITS_USED_UP, [5], 5)).toBe(true);
        expect(isDigitKeyDisabled(NO_DIGITS_USED_UP, [5], 6)).toBe(false);
    });

    it("should leave every key of an unused board on", () => {
        expect(NO_DIGITS_USED_UP).toHaveLength(10);
        expect([1, 2, 3, 4, 5, 6, 7, 8, 9].some(digit => isDigitUsedUp(NO_DIGITS_USED_UP, digit))).toBe(false);
    });
});
