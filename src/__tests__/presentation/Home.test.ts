import { describe, expect, it } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import Home from "@/presentation/pages/home/Home.vue";
import { ROUTER_PATH } from "@/router";
import { useGameStore } from "@/stores/gameStore";

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

describe("Home", () => {
    it("should navigate to game page when clicking New Game button", async () => {
        const { wrapper, router } = mountHome();
        await router.push("/");
        await router.isReady();

        await wrapper.find("[data-testid='new-game-button']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
    });

    it("should show Easy as default difficulty", () => {
        const { wrapper } = mountHome();

        expect(wrapper.find("[data-testid='difficulty-label']").text()).toBe("Easy");
    });

    it("should cycle difficulty forward when clicking next button", async () => {
        const { wrapper } = mountHome();

        await wrapper.find("[data-testid='difficulty-next']").trigger("click");
        expect(wrapper.find("[data-testid='difficulty-label']").text()).toBe("Medium");

        await wrapper.find("[data-testid='difficulty-next']").trigger("click");
        expect(wrapper.find("[data-testid='difficulty-label']").text()).toBe("Hard");

        await wrapper.find("[data-testid='difficulty-next']").trigger("click");
        expect(wrapper.find("[data-testid='difficulty-label']").text()).toBe("Easy");
    });

    it("should cycle difficulty backward when clicking prev button", async () => {
        const { wrapper } = mountHome();

        await wrapper.find("[data-testid='difficulty-prev']").trigger("click");
        expect(wrapper.find("[data-testid='difficulty-label']").text()).toBe("Hard");
    });

    it("should set difficulty in store when starting game", async () => {
        const { wrapper, router, pinia } = mountHome();
        await router.push("/");
        await router.isReady();

        await wrapper.find("[data-testid='difficulty-next']").trigger("click");
        await wrapper.find("[data-testid='new-game-button']").trigger("click");
        await flushPromises();

        const gameStore = useGameStore(pinia);
        expect(gameStore.difficulty).toBe("medium");
        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
    });
});
