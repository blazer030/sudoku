import { createRouter, createWebHistory } from "vue-router";
import Home from "@/presentation/pages/home/Home.vue";
import Game from "@/presentation/pages/game/Game.vue";
import Statistics from "@/presentation/pages/statistics/Statistics.vue";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const ROUTER_PATH = {
    home: "/",
    game: "/game",
    statistics: "/statistics",
};

export const router = createRouter({
    history: createWebHistory(baseUrl),
    routes: [
        { path: "/", component: Home },
        { path: "/game", component: Game },
        { path: "/statistics", component: Statistics },
        { path: "/:pathMatch(.*)*", redirect: "/" },
    ],
});
