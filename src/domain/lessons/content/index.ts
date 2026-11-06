import { FILLING_IN, HIDDEN_SINGLE, NAKED_SINGLE, RULES } from "@/domain/lessons/content/basicsAndEasy";
import type { Lesson, LessonId } from "@/domain/lessons/Lesson";

export const LESSONS: Partial<Record<LessonId, Lesson>> = {
    rules: RULES,
    fillingIn: FILLING_IN,
    hiddenSingle: HIDDEN_SINGLE,
    nakedSingle: NAKED_SINGLE,
};

export const lessonContent = (id: LessonId): Lesson | null => LESSONS[id] ?? null;
