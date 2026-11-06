import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import type { LessonGroupId, LessonId } from "@/domain/lessons/Lesson";
import type { TechniqueId } from "@/domain/solver/SolveStep";

export interface LessonGroup {
    id: LessonGroupId;
    lessons: readonly LessonId[];
    /** The difficulty these lessons are enough to solve; the rules and input teach none of their own. */
    difficulty: Difficulty | null;
}

export const LESSON_GROUPS: readonly LessonGroup[] = [
    { id: "basics", lessons: ["rules", "fillingIn"], difficulty: null },
    { id: "easy", lessons: ["hiddenSingle", "nakedSingle"], difficulty: "easy" },
    { id: "medium", lessons: ["pointing", "claiming", "nakedPair", "hiddenPair", "nakedSubset", "hiddenSubset"], difficulty: "medium" },
    { id: "hard", lessons: ["xWing", "fish", "xyWing", "wWing", "xyzWing", "xChain", "xyChain"], difficulty: "hard" },
];

export const ALL_LESSON_IDS: readonly LessonId[] = LESSON_GROUPS.flatMap(group => group.lessons);

const LESSON_BY_TECHNIQUE: Record<TechniqueId, LessonId> = {
    nakedSingle: "nakedSingle",
    hiddenSingle: "hiddenSingle",
    nakedPair: "nakedPair",
    nakedTriple: "nakedSubset",
    nakedQuad: "nakedSubset",
    hiddenPair: "hiddenPair",
    hiddenTriple: "hiddenSubset",
    hiddenQuad: "hiddenSubset",
    pointing: "pointing",
    claiming: "claiming",
    xWing: "xWing",
    swordfish: "fish",
    jellyfish: "fish",
    xyWing: "xyWing",
    wWing: "wWing",
    xyzWing: "xyzWing",
    wxyzWing: "xyzWing",
    xChain: "xChain",
    xyChain: "xyChain",
};

export const lessonForTechnique = (technique: TechniqueId): LessonId => LESSON_BY_TECHNIQUE[technique];

export const isLessonId = (id: string): id is LessonId => (ALL_LESSON_IDS as readonly string[]).includes(id);

export const groupOfLesson = (id: LessonId): LessonGroup => {
    const group = LESSON_GROUPS.find(candidate => candidate.lessons.includes(id));
    if (!group) throw new Error(`Lesson ${id} is in no group`);
    return group;
};
