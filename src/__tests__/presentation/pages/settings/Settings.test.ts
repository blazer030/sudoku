import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";

vi.mock("@capacitor/core", () => ({
    Capacitor: {
        isNativePlatform: vi.fn(),
        getPlatform: vi.fn().mockReturnValue("web"),
    },
}));

vi.mock("@/application/PwaThemeUpdater", () => ({
    updateMetaThemeColor: vi.fn(),
    updateFavicon: vi.fn(),
    updateManifestLink: vi.fn(),
    updateAppleTouchIcon: vi.fn(),
}));

import { Capacitor } from "@capacitor/core";
import Settings from "@/presentation/pages/settings/Settings.vue";

const mountSettings = () => {
    setActivePinia(createPinia());
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/", component: { template: "<div />" } },
            { path: "/settings", component: Settings },
            { path: "/settings/changelog", component: { template: "<div />" } },
            { path: "/donate", component: { template: "<div />" } },
        ],
    });
    return mount(Settings, { global: { plugins: [router] } });
};

describe("Settings.vue Support section", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(Capacitor.isNativePlatform).mockReset();
    });

    it("hides Support section on web", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
        const wrapper = mountSettings();
        expect(wrapper.find("[data-testid='donate-link']").exists()).toBe(false);
    });

    it("shows Support section on native", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings();
        expect(wrapper.find("[data-testid='donate-link']").exists()).toBe(true);
    });
});

describe("Settings.vue match-launcher-icon toggle", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(Capacitor.isNativePlatform).mockReset();
    });

    it("hides the toggle on web", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
        const wrapper = mountSettings();
        expect(wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").exists()).toBe(false);
    });

    it("shows confirm dialog when tapping the toggle while OFF", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings();
        await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");
        expect(wrapper.find("[data-testid='icon-dialog-confirm']").exists()).toBe(true);
    });

    it("enables the setting only after the user confirms", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings();
        await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");
        await wrapper.find("[data-testid='icon-dialog-confirm']").trigger("click");

        const { useSettingsStore } = await import("@/stores/settingsStore");
        expect(useSettingsStore().matchLauncherIconToTheme).toBe(true);
        expect(wrapper.find("[data-testid='icon-dialog-confirm']").exists()).toBe(false);
    });

    it("keeps the setting OFF when the user cancels the dialog", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings();
        await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");
        await wrapper.find("[data-testid='icon-dialog-cancel']").trigger("click");

        const { useSettingsStore } = await import("@/stores/settingsStore");
        expect(useSettingsStore().matchLauncherIconToTheme).toBe(false);
        expect(wrapper.find("[data-testid='icon-dialog-confirm']").exists()).toBe(false);
    });

    it("disables without a dialog when toggling from ON", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings();
        await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");
        await wrapper.find("[data-testid='icon-dialog-confirm']").trigger("click");
        await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");

        expect(wrapper.find("[data-testid='icon-dialog-confirm']").exists()).toBe(false);
        const { useSettingsStore } = await import("@/stores/settingsStore");
        expect(useSettingsStore().matchLauncherIconToTheme).toBe(false);
    });
});
