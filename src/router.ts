import { createRouter, createWebHistory } from "vue-router";
import Home from "@/presentation/pages/home/Home.vue";
import Game from "@/presentation/pages/game/Game.vue";

const baseUrl: string = import.meta.env.VITE_BASE_URL as string;

export const ROUTER_PATH = {
    home: baseUrl,
    game: `${baseUrl}game`,
};

export const router = createRouter({
    history: createWebHistory(baseUrl),
    routes: [
        { path: "/", component: Home },
        { path: "/game", component: Game },
        { path: "/:pathMatch(.*)*", redirect: "/" },
    ],
});
