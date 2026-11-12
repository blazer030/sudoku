import { TECHNIQUE_IDS, TECHNIQUE_IDS_BY_DIFFICULTY, createTechniques, findFirstStep } from "@/domain/solver/techniqueRegistry";
import { BoardState } from "@/domain/solver/BoardState";
import { singlesPuzzle } from "@/__tests__/fixtures/singlesPuzzle";

describe("techniqueRegistry", () => {
    it("should let each difficulty take the techniques of the one below and more, in solving order", () => {
        const { easy, medium, hard } = TECHNIQUE_IDS_BY_DIFFICULTY;

        expect(medium.slice(0, easy.length)).toEqual(easy);
        expect(hard.slice(0, medium.length)).toEqual(medium);
        expect(hard).toEqual(TECHNIQUE_IDS);
        expect(medium).toEqual(TECHNIQUE_IDS.slice(0, medium.length));
    });

    it("should take the step of the first technique that applies", () => {
        const step = findFirstStep(BoardState.fromPuzzle(singlesPuzzle), createTechniques(TECHNIQUE_IDS));

        expect(step?.technique).toBe("nakedSingle");
    });

    it("should find nothing when no technique is given", () => {
        expect(findFirstStep(BoardState.fromPuzzle(singlesPuzzle), [])).toBeNull();
    });
});
