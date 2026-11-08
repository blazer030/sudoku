import { FILLING_IN, HIDDEN_SINGLE, NAKED_SINGLE, RULES } from "@/domain/lessons/content/basicsAndEasy";
import { HARD_LESSONS } from "@/domain/lessons/content/hard";
import { MEDIUM_LESSONS } from "@/domain/lessons/content/medium";
import type { Lesson, LessonId } from "@/domain/lessons/Lesson";

export const LESSONS: Record<LessonId, Lesson> = {
    rules: RULES,
    fillingIn: FILLING_IN,
    hiddenSingle: HIDDEN_SINGLE,
    nakedSingle: NAKED_SINGLE,
    ...MEDIUM_LESSONS,
    ...HARD_LESSONS,
};

export const lessonContent = (id: LessonId): Lesson => LESSONS[id];
