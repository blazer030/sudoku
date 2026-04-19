import { DifficultyRater } from "@/domain/solver/DifficultyRater";
import { singlesPuzzle } from "@/__tests__/fixtures/singlesPuzzle";

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
});
