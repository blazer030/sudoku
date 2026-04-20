import { createRouter, createWebHistory } from "vue-router";
import Home from "@/presentation/pages/home/Home.vue";
import Game from "@/presentation/pages/game/Game.vue";
import Statistics from "@/presentation/pages/statistics/Statistics.vue";
import Settings from "@/presentation/pages/settings/Settings.vue";
import Changelog from "@/presentation/pages/settings/Changelog.vue";
import GameReview from "@/presentation/pages/game-review/GameReview.vue";
import SolverWalkthrough from "@/presentation/pages/solver-walkthrough/SolverWalkthrough.vue";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const ROUTER_PATH = {
    home: "/",
    game: "/game",
    statistics: "/statistics",
    settings: "/settings",
    changelog: "/settings/changelog",
    gameReview: "/game-review/:index",
    gameReviewFor: (index: number) => `/game-review/${index}`,
    solverWalkthrough: "/solver",
};

export const router = createRouter({
    history: createWebHistory(baseUrl),
    routes: [
        { path: "/", component: Home },
        { path: "/game", component: Game },
        { path: "/statistics", component: Statistics },
        { path: "/settings", component: Settings },
        { path: "/settings/changelog", component: Changelog },
        { path: "/game-review/:index", component: GameReview, props: true },
        { path: "/solver", component: SolverWalkthrough },
        { path: "/:pathMatch(.*)*", redirect: "/" },
    ],
});
