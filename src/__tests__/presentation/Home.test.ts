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

        await wrapper.find("button").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
    });
});
