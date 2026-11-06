import { LESSON_GROUPS, lessonForTechnique } from "@/domain/lessons/curriculum";
import type { TechniqueId } from "@/domain/solver/SolveStep";

describe("curriculum", () => {
    it("should list the lessons by group, in their teaching order", () => {
        expect(LESSON_GROUPS.map(group => [group.id, group.lessons])).toEqual([
            ["basics", ["rules", "fillingIn"]],
            ["easy", ["hiddenSingle", "nakedSingle"]],
            ["medium", ["pointing", "claiming", "nakedPair", "hiddenPair", "nakedSubset", "hiddenSubset"]],
            ["hard", ["xWing", "fish", "xyWing", "wWing", "xyzWing", "xChain", "xyChain"]],
        ]);
    });

    it.each<[TechniqueId, string]>([
        ["hiddenSingle", "hiddenSingle"],
        ["nakedSingle", "nakedSingle"],
        ["pointing", "pointing"],
        ["claiming", "claiming"],
        ["nakedPair", "nakedPair"],
        ["hiddenPair", "hiddenPair"],
        ["nakedTriple", "nakedSubset"],
        ["nakedQuad", "nakedSubset"],
        ["hiddenTriple", "hiddenSubset"],
        ["hiddenQuad", "hiddenSubset"],
        ["xWing", "xWing"],
        ["swordfish", "fish"],
        ["jellyfish", "fish"],
        ["xyWing", "xyWing"],
        ["wWing", "wWing"],
        ["xyzWing", "xyzWing"],
        ["wxyzWing", "xyzWing"],
        ["xChain", "xChain"],
        ["xyChain", "xyChain"],
    ])("should teach %s in the %s lesson", (technique, lesson) => {
        expect(lessonForTechnique(technique)).toBe(lesson);
    });
});
