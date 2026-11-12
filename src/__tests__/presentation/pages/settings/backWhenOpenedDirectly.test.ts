import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createWebHistory, RouterView, type Router } from "vue-router";

vi.mock("@capacitor/core", () => ({
    Capacitor: {
        isNativePlatform: vi.fn().mockReturnValue(false),
        getPlatform: vi.fn().mockReturnValue("web"),
    },
}));

vi.mock("@/application/pwaTheme/PwaThemeUpdater", () => ({
    updateMetaThemeColor: vi.fn(),
    updateFavicon: vi.fn(),
    updateManifestLink: vi.fn(),
    updateAppleTouchIcon: vi.fn(),
}));

import Appearance from "@/presentation/pages/settings/Appearance.vue";
import Changelog from "@/presentation/pages/settings/Changelog.vue";
import Settings from "@/presentation/pages/settings/Settings.vue";
import { ROUTER_PATH } from "@/routerPaths";

let router: Router;

// Real browser history, whose first entry has no page before it, as when a URL is typed or a tab restored
const openDirectly = async (path: string) => {
    setActivePinia(createPinia());
    window.history.replaceState(null, "", path);
    router = createRouter({
        history: createWebHistory(),
        routes: [
            { path: ROUTER_PATH.home, component: { template: "<div data-testid='home' />" } },
            { path: ROUTER_PATH.settings, component: Settings },
            { path: ROUTER_PATH.changelog, component: Changelog },
            { path: ROUTER_PATH.appearance, component: Appearance },
        ],
    });
    await router.push(path);
    const wrapper = mount(RouterView, { global: { plugins: [router] } });
    await flushPromises();
    return wrapper;
};

type PageWrapper = Awaited<ReturnType<typeof openDirectly>>;

const tapBack = async (wrapper: PageWrapper) => {
    await wrapper.get("[data-testid='back-button']").trigger("click");
    await flushPromises();
};

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    router.options.history.destroy();
});

describe("the back button of a settings page opened directly", () => {
    it("should go from Settings to Home, in place of the entry it was on", async () => {
        const wrapper = await openDirectly("/settings");
        const entriesBefore = window.history.length;

        await tapBack(wrapper);

        expect(router.currentRoute.value.path).toBe("/");
        expect(wrapper.find("[data-testid='home']").exists()).toBe(true);
        expect(window.history.length).toBe(entriesBefore);
    });

    it.each(["/settings/appearance", "/settings/changelog"])("should go from %s up to Settings", async (path) => {
        const wrapper = await openDirectly(path);

        await tapBack(wrapper);

        expect(router.currentRoute.value.path).toBe("/settings");
    });

    it("should walk from a sub page through Settings to Home", async () => {
        const wrapper = await openDirectly("/settings/appearance");

        await tapBack(wrapper);
        await tapBack(wrapper);

        expect(router.currentRoute.value.path).toBe("/");
    });
});

describe("the back button of a settings page reached through the app", () => {
    it("should return to the page it came from, not its parent", async () => {
        const wrapper = await openDirectly("/settings");
        await router.push("/");
        await router.push("/settings/changelog");
        await flushPromises();

        const popped = new Promise((resolve) => { window.addEventListener("popstate", resolve, { once: true }); });
        await tapBack(wrapper);
        await popped;
        await flushPromises();

        expect(router.currentRoute.value.path).toBe("/");
    });
});
