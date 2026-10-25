import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "@/presentation/App.vue";

const mountApp = async () => {
    const page = { template: "<div />" };
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: "/", component: page }],
    });
    await router.push("/");
    await router.isReady();
    return mount(App, { global: { plugins: [router] }, attachTo: document.body });
};

// jsdom lays nothing out, so the scroller's sizes are given and its offset is kept as a browser would
const giveScrollerSizes = (scroller: Element, sizes: { scrollHeight: number; clientHeight: number; scrollTop: number }) => {
    let scrollTop = sizes.scrollTop;
    Object.defineProperty(scroller, "scrollHeight", { configurable: true, get: () => sizes.scrollHeight });
    Object.defineProperty(scroller, "clientHeight", { configurable: true, get: () => sizes.clientHeight });
    Object.defineProperty(scroller, "scrollTop", {
        configurable: true,
        get: () => scrollTop,
        set: (value: number) => { scrollTop = value; },
    });
};

describe("App page scroller", () => {
    it("should bring a page back within reach when the window grows past its scroll offset", async () => {
        const wrapper = await mountApp();
        const scroller = wrapper.get('[data-testid="page-scroller"]').element;
        // Android's WebView keeps the old offset after a resize, though the page now fits
        giveScrollerSizes(scroller, { scrollHeight: 900, clientHeight: 900, scrollTop: 140 });

        window.dispatchEvent(new Event("resize"));

        expect(scroller.scrollTop).toBe(0);
        wrapper.unmount();
    });

    it("should keep a page scrolled as far as it still can after a resize", async () => {
        const wrapper = await mountApp();
        const scroller = wrapper.get('[data-testid="page-scroller"]').element;
        giveScrollerSizes(scroller, { scrollHeight: 900, clientHeight: 800, scrollTop: 140 });

        window.dispatchEvent(new Event("resize"));

        expect(scroller.scrollTop).toBe(100);
        wrapper.unmount();
    });

    it("should leave an offset that is still in reach alone after a resize", async () => {
        const wrapper = await mountApp();
        const scroller = wrapper.get('[data-testid="page-scroller"]').element;
        giveScrollerSizes(scroller, { scrollHeight: 900, clientHeight: 600, scrollTop: 140 });

        window.dispatchEvent(new Event("resize"));

        expect(scroller.scrollTop).toBe(140);
        wrapper.unmount();
    });

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
