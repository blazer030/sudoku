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
import { ROUTER_PATH } from "@/routerPaths";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const NATIVE_ONLY_ROUTES: string[] = [ROUTER_PATH.donate];

export const applyNativeOnlyGuard = (to: { path: string }): string | undefined => {
    if (!NATIVE_ONLY_ROUTES.includes(to.path)) return undefined;
    if (Capacitor.isNativePlatform()) return undefined;
    return ROUTER_PATH.home;
};

export const applyLessonGuard = (to: { params: Record<string, unknown> }): string | undefined =>
    (isLessonId(String(to.params.lessonId)) ? undefined : ROUTER_PATH.lessons);

export const router = createRouter({
    history: createWebHistory(baseUrl),
    routes: [
        { path: ROUTER_PATH.home, component: Home },
        { path: ROUTER_PATH.game, component: Game },
        { path: ROUTER_PATH.statistics, component: Statistics },
        { path: ROUTER_PATH.settings, component: Settings },
        { path: ROUTER_PATH.changelog, component: Changelog },
        { path: ROUTER_PATH.appearance, component: Appearance },
        { path: ROUTER_PATH.donate, component: Donate },
        { path: ROUTER_PATH.gameReview, component: GameReview, props: true },
        { path: ROUTER_PATH.solverWalkthrough, component: SolverWalkthrough },
        { path: ROUTER_PATH.lessons, component: LessonList },
        { path: ROUTER_PATH.lesson, component: LessonPage, props: true, beforeEnter: applyLessonGuard },
        { path: "/:pathMatch(.*)*", redirect: ROUTER_PATH.home },
    ],
});

router.beforeEach((to) => applyNativeOnlyGuard(to));
