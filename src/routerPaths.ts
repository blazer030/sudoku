// The app's route paths, apart from the router so a page can link to another without importing every page
import type { LessonId } from "@/domain/lessons/Lesson";

export const ROUTER_PATH = {
    home: "/",
    game: "/game",
    statistics: "/statistics",
    settings: "/settings",
    changelog: "/settings/changelog",
    appearance: "/settings/appearance",
    donate: "/donate",
    gameReview: "/game-review/:index",
    gameReviewFor: (index: number) => `/game-review/${index}`,
    solverWalkthrough: "/solver",
    lessons: "/lessons",
    lesson: "/lessons/:lessonId",
    lessonFor: (lessonId: LessonId) => `/lessons/${lessonId}`,
};
