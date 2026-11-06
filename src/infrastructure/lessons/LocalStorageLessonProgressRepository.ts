import type { LessonProgressRepository } from "@/application/lessons/LessonProgressRepository";
import { isLessonId } from "@/domain/lessons/curriculum";
import type { LessonId } from "@/domain/lessons/Lesson";

const STORAGE_KEY = "sudoku-lesson-progress";

export class LocalStorageLessonProgressRepository implements LessonProgressRepository {
    public load(): LessonId[] {
        try {
            const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
            if (!Array.isArray(stored)) return [];
            return stored.filter((id): id is LessonId => typeof id === "string" && isLessonId(id));
        } catch {
            // Progress it cannot read counts as none: the lessons still open, and finishing one writes it anew
            return [];
        }
    }

    public save(finished: readonly LessonId[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(finished));
        } catch {
            // Storage is full or blocked: progress lasts until the app closes, and the lesson itself is unaffected
        }
    }
}
