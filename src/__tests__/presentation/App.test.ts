import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "@/presentation/App.vue";

describe("App page scroller", () => {
    it("should reset the page scroller to the top on every route change", async () => {
        const page = { template: "<div />" };
        const router = createRouter({
            history: createMemoryHistory(),
            routes: [
                { path: "/", component: page },
                { path: "/game", component: page },
            ],
        });
        await router.push("/");
        await router.isReady();
        const wrapper = mount(App, { global: { plugins: [router] } });
        const scroller = wrapper.get('[data-testid="page-scroller"]').element;
        scroller.scrollTop = 50;

        await router.push("/game");
        await wrapper.vm.$nextTick();

        expect(scroller.scrollTop).toBe(0);
    });
});
