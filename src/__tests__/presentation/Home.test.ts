import { describe, expect, it } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import Home from "@/presentation/pages/home/Home.vue";
import { ROUTER_PATH } from "@/router";

function createTestRouter() {
    return createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/", component: Home },
            { path: "/game", component: { template: "<div>Game</div>" } },
        ],
    });
}

describe("Home", () => {
    it("should navigate to game page when clicking New Game button", async () => {
        const router = createTestRouter();
        await router.push("/");
        await router.isReady();

        const wrapper = mount(Home, {
            global: { plugins: [router] },
        });

        await wrapper.find("[data-testid='new-game-button']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
    });

    it("should show Easy as default difficulty", () => {
        const router = createTestRouter();
        const wrapper = mount(Home, {
            global: { plugins: [router] },
        });

        expect(wrapper.find("[data-testid='difficulty-label']").text()).toBe("Easy");
    });

    it("should cycle difficulty forward when clicking next button", async () => {
        const router = createTestRouter();
        const wrapper = mount(Home, {
            global: { plugins: [router] },
        });

        await wrapper.find("[data-testid='difficulty-next']").trigger("click");
        expect(wrapper.find("[data-testid='difficulty-label']").text()).toBe("Medium");

        await wrapper.find("[data-testid='difficulty-next']").trigger("click");
        expect(wrapper.find("[data-testid='difficulty-label']").text()).toBe("Hard");

        // 循環回 Easy
        await wrapper.find("[data-testid='difficulty-next']").trigger("click");
        expect(wrapper.find("[data-testid='difficulty-label']").text()).toBe("Easy");
    });

    it("should cycle difficulty backward when clicking prev button", async () => {
        const router = createTestRouter();
        const wrapper = mount(Home, {
            global: { plugins: [router] },
        });

        // 從 Easy 往前循環到 Hard
        await wrapper.find("[data-testid='difficulty-prev']").trigger("click");
        expect(wrapper.find("[data-testid='difficulty-label']").text()).toBe("Hard");
    });

    it("should navigate to game page with selected difficulty", async () => {
        const router = createTestRouter();
        await router.push("/");
        await router.isReady();

        const wrapper = mount(Home, {
            global: { plugins: [router] },
        });

        // 切到 Medium
        await wrapper.find("[data-testid='difficulty-next']").trigger("click");

        await wrapper.find("[data-testid='new-game-button']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
        expect(router.currentRoute.value.query.difficulty).toBe("medium");
    });
});
