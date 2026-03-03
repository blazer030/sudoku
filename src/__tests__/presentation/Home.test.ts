import { afterEach, describe, expect, it } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import Home from "@/presentation/pages/home/Home.vue";
import { ROUTER_PATH } from "@/router";
import { useGameStore } from "@/stores/gameStore";
import { hasSavedGame, saveGame } from "@/application/GameStorage";
import type { GameState } from "@/application/GameState";

function createTestRouter() {
    return createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/", component: Home },
            { path: "/game", component: { template: "<div>Game</div>" } },
        ],
    });
}

function mountHome() {
    const router = createTestRouter();
    const pinia = createPinia();
    const wrapper = mount(Home, {
        global: { plugins: [router, pinia] },
    });
    return { wrapper, router, pinia };
}

const dummySave: GameState = {
    difficulty: "easy",
    answer: Array.from({ length: 9 }, () => Array(9).fill(0) as number[]),
    cells: Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => ({ value: 0, input: 0, notes: [] as number[] }))
    ),
    elapsedSeconds: 204,
    completed: false,
};

afterEach(() => {
    localStorage.clear();
});

describe("Home", () => {
    it("should navigate to game page when clicking New Game button", async () => {
        const { wrapper, router } = mountHome();
        await router.push("/");
        await router.isReady();

        await wrapper.find("[data-testid='new-game-button']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
    });

    it("should show Easy as default selected difficulty", () => {
        const { wrapper } = mountHome();
        const easyBtn = wrapper.find("[data-testid='difficulty-easy']");

        expect(easyBtn.classes()).toContain("bg-primary");
    });

    it("should select difficulty when clicking pill", async () => {
        const { wrapper } = mountHome();

        await wrapper.find("[data-testid='difficulty-medium']").trigger("click");
        expect(wrapper.find("[data-testid='difficulty-medium']").classes()).toContain("bg-primary");
        expect(wrapper.find("[data-testid='difficulty-easy']").classes()).not.toContain("bg-primary");

        await wrapper.find("[data-testid='difficulty-hard']").trigger("click");
        expect(wrapper.find("[data-testid='difficulty-hard']").classes()).toContain("bg-primary");
        expect(wrapper.find("[data-testid='difficulty-medium']").classes()).not.toContain("bg-primary");
    });

    it("should show Continue button when saved game exists", () => {
        saveGame(dummySave);
        const { wrapper } = mountHome();

        expect(wrapper.find("[data-testid='continue-button']").exists()).toBe(true);
    });

    it("should not show Continue button when no saved game exists", () => {
        const { wrapper } = mountHome();

        expect(wrapper.find("[data-testid='continue-button']").exists()).toBe(false);
    });

    it("should display saved elapsed time on Continue button", () => {
        saveGame(dummySave);
        const { wrapper } = mountHome();

        expect(wrapper.find("[data-testid='continue-button']").text()).toContain("03:24");
    });

    it("should navigate to game page with continueGame flag when clicking Continue", async () => {
        saveGame(dummySave);
        const { wrapper, router, pinia } = mountHome();
        await router.push("/");
        await router.isReady();

        await wrapper.find("[data-testid='continue-button']").trigger("click");
        await flushPromises();

        const gameStore = useGameStore(pinia);
        expect(gameStore.continueGame).toBe(true);
        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
    });

    it("should clear saved game when clicking New Game", async () => {
        saveGame(dummySave);
        const { wrapper, router } = mountHome();
        await router.push("/");
        await router.isReady();

        await wrapper.find("[data-testid='new-game-button']").trigger("click");
        await flushPromises();

        expect(hasSavedGame()).toBe(false);
    });

    it("should set difficulty in store when starting game", async () => {
        const { wrapper, router, pinia } = mountHome();
        await router.push("/");
        await router.isReady();

        await wrapper.find("[data-testid='difficulty-medium']").trigger("click");
        await wrapper.find("[data-testid='new-game-button']").trigger("click");
        await flushPromises();

        const gameStore = useGameStore(pinia);
        expect(gameStore.difficulty).toBe("medium");
        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
    });
});
