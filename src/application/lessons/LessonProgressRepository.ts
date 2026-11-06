import type { LessonId } from "@/domain/lessons/Lesson";

/** Which lessons the player has finished. Separate from game records, so clearing those leaves it alone. */
export interface LessonProgressRepository {
    load(): LessonId[];
    save(finished: readonly LessonId[]): void;
}
