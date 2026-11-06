import { createRouter, createWebHistory } from "vue-router";
import { Capacitor } from "@capacitor/core";
import Home from "@/presentation/pages/home/Home.vue";
import Game from "@/presentation/pages/game/Game.vue";
import Statistics from "@/presentation/pages/statistics/Statistics.vue";
import Settings from "@/presentation/pages/settings/Settings.vue";
import Changelog from "@/presentation/pages/settings/Changelog.vue";
import Appearance from "@/presentation/pages/settings/Appearance.vue";
import Donate from "@/presentation/pages/donate/Donate.vue";
import GameReview from "@/presentation/pages/game-review/GameReview.vue";
import SolverWalkthrough from "@/presentation/pages/solver-walkthrough/SolverWalkthrough.vue";
import LessonList from "@/presentation/pages/lessons/LessonList.vue";
import LessonPage from "@/presentation/pages/lessons/LessonPage.vue";
import { isLessonId } from "@/domain/lessons/curriculum";
import type { LessonId } from "@/domain/lessons/Lesson";

const baseUrl = import.meta.env.VITE_BASE_URL;

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

export const NATIVE_ONLY_ROUTES: string[] = ["/donate"];

export const applyNativeOnlyGuard = (to: { path: string }): string | undefined => {
    if (!NATIVE_ONLY_ROUTES.includes(to.path)) return undefined;
    if (Capacitor.isNativePlatform()) return undefined;
    return "/";
};

export const applyLessonGuard = (to: { params: Record<string, unknown> }): string | undefined =>
    (isLessonId(String(to.params.lessonId)) ? undefined : ROUTER_PATH.lessons);

export const router = createRouter({
    history: createWebHistory(baseUrl),
    routes: [
        { path: "/", component: Home },
        { path: "/game", component: Game },
        { path: "/statistics", component: Statistics },
        { path: "/settings", component: Settings },
        { path: "/settings/changelog", component: Changelog },
        { path: "/settings/appearance", component: Appearance },
        { path: "/donate", component: Donate },
        { path: "/game-review/:index", component: GameReview, props: true },
        { path: "/solver", component: SolverWalkthrough },
        { path: "/lessons", component: LessonList },
        { path: "/lessons/:lessonId", component: LessonPage, props: true, beforeEnter: applyLessonGuard },
        { path: "/:pathMatch(.*)*", redirect: "/" },
    ],
});

router.beforeEach((to) => applyNativeOnlyGuard(to));
