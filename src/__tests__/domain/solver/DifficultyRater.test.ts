import { DifficultyRater } from "@/domain/solver/DifficultyRater";
import { singlesPuzzle } from "@/__tests__/fixtures/singlesPuzzle";
import { mediumTierPuzzle } from "@/__tests__/fixtures/ratedPuzzles";

describe("DifficultyRater", () => {
    it("should rate a puzzle solvable by singles only as easy", () => {
        const rater = new DifficultyRater();

        expect(rater.rate(singlesPuzzle)).toBe("easy");
    });

    it("matches easy should be true for a singles-only puzzle", () => {
        const rater = new DifficultyRater();

        expect(rater.matches(singlesPuzzle, "easy")).toBe(true);
    });

    it("matches medium should be false for a singles-only puzzle", () => {
        const rater = new DifficultyRater();

        expect(rater.matches(singlesPuzzle, "medium")).toBe(false);
    });

    it("matches hard should be false for a singles-only puzzle", () => {
        const rater = new DifficultyRater();

        expect(rater.matches(singlesPuzzle, "hard")).toBe(false);
    });

    it("should rate a puzzle that needs subsets or intersections as medium", () => {
        const rater = new DifficultyRater();

        expect(rater.rate(mediumTierPuzzle)).toBe("medium");
    });

    it("matches medium should require the puzzle be unsolvable by singles alone", () => {
        const rater = new DifficultyRater();

        expect(rater.matches(mediumTierPuzzle, "medium")).toBe(true);
        expect(rater.matches(mediumTierPuzzle, "easy")).toBe(false);
        expect(rater.matches(mediumTierPuzzle, "hard")).toBe(false);
    });
});
