import type { Lesson, LessonId } from "@/domain/lessons/Lesson";

const LESSONS: Partial<Record<LessonId, Lesson>> = {};

export const lessonContent = (id: LessonId): Lesson | null => LESSONS[id] ?? null;
