import { describe, it, expect, vi, beforeEach } from "vitest";
import { nextTick } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { storeToRefs } from "pinia";
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
import { i18n } from "@/presentation/i18n";
import { startLocaleSync } from "@/presentation/i18n/localeSync";
import { useSettingsStore } from "@/stores/settingsStore";
import { useDonateStore } from "@/stores/donateStore";
import type { BillingService, Product } from "@/application/billing/BillingService";
import Settings from "@/presentation/pages/settings/Settings.vue";

const fakeProducts: Product[] = [
    { id: "donate_coffee", tier: "coffee", priceText: "$2.99", amountUsd: 2.99 },
];

const buildBilling = (loadProducts: BillingService["loadProducts"]): BillingService => ({
    loadProducts,
    purchase: vi.fn(),
    consumeAll: vi.fn().mockResolvedValue(undefined),
});

const mountSettings = (billing?: BillingService) => {
    setActivePinia(createPinia());
    if (billing !== undefined) useDonateStore().setBilling(billing);
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

    it("hides the donate entry on web and never loads products", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
        const loadProducts = vi.fn().mockResolvedValue(fakeProducts);
        const wrapper = mountSettings(buildBilling(loadProducts));
        await flushPromises();
        expect(wrapper.find("[data-testid='donate-link']").exists()).toBe(false);
        expect(loadProducts).not.toHaveBeenCalled();
    });

    it("shows the donate entry on native when Play returns products", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings(buildBilling(vi.fn().mockResolvedValue(fakeProducts)));
        await flushPromises();
        expect(wrapper.find("[data-testid='donate-link']").exists()).toBe(true);
    });

    it("hides the donate entry on native when Play returns no products", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings(buildBilling(vi.fn().mockResolvedValue([])));
        await flushPromises();
        expect(wrapper.find("[data-testid='donate-link']").exists()).toBe(false);
    });

    it("hides the donate entry on native when loading products fails", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings(buildBilling(vi.fn().mockRejectedValue(new Error("unavailable"))));
        await flushPromises();
        expect(wrapper.find("[data-testid='donate-link']").exists()).toBe(false);
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

    it("enables the setting immediately without a confirm dialog", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings();
        await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");

        expect(wrapper.find("[data-testid='icon-dialog-confirm']").exists()).toBe(false);
        expect(useSettingsStore().matchLauncherIconToTheme).toBe(true);
    });

    it("asks the icon service to apply the current theme when enabled", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings();
        const setIcon = vi.fn().mockResolvedValue(undefined);
        const settingsStore = useSettingsStore();
        settingsStore.setIconService({ setIcon });
        await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");

        expect(setIcon).toHaveBeenCalledWith(settingsStore.colorTheme);
    });

    it("disables the setting when toggling from ON", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings();
        await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");
        await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");

        expect(useSettingsStore().matchLauncherIconToTheme).toBe(false);
    });

    it("explains that the icon updates after leaving the app", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings();
        expect(wrapper.text()).toContain("The icon updates after you leave the app");
    });

    it("shows the note in Chinese", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings();
        const { language } = storeToRefs(useSettingsStore());
        const stopLocaleSync = startLocaleSync(language);
        try {
            await wrapper.find("[data-testid='language-zh-Hant']").trigger("click");
            await nextTick();
            expect(wrapper.text()).toContain("離開 App 後圖示才會更新");
        } finally {
            stopLocaleSync();
        }
    });
});

describe("Settings.vue language switcher", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(Capacitor.isNativePlatform).mockReset();
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    });

    it("should render language options with native names", () => {
        const wrapper = mountSettings();
        expect(wrapper.find("[data-testid='language-en']").text()).toBe("English");
        expect(wrapper.find("[data-testid='language-zh-Hant']").text()).toBe("繁體中文");
        expect(wrapper.find("[data-testid='language-system']").text()).toBe("System");
    });

    it("should mark system as selected by default", () => {
        const wrapper = mountSettings();
        expect(wrapper.find("[data-testid='language-system']").attributes("aria-pressed")).toBe("true");
        expect(wrapper.find("[data-testid='language-en']").attributes("aria-pressed")).toBe("false");
    });

    it("should switch the whole page to Chinese immediately when 繁體中文 is chosen", async () => {
        const wrapper = mountSettings();
        const { language } = storeToRefs(useSettingsStore());
        const stopLocaleSync = startLocaleSync(language);
        try {
            await wrapper.find("[data-testid='language-zh-Hant']").trigger("click");
            await nextTick();

            expect(i18n.global.locale.value).toBe("zh-Hant");
            expect(wrapper.text()).toContain("設定");
            expect(wrapper.text()).toContain("跟隨系統");
            expect(wrapper.text()).toContain("標示相同數字");
            expect(wrapper.find("[data-testid='language-zh-Hant']").text()).toBe("繁體中文");
            expect(wrapper.find("[data-testid='language-en']").text()).toBe("English");
            expect(wrapper.find("[data-testid='language-zh-Hant']").attributes("aria-pressed")).toBe("true");
            const gameplay = wrapper.get("[data-testid='settings-group-gameplay']").text();
            expect(gameplay).toContain("遊戲");
            expect(gameplay).toContain("標示同列、欄、宮");
        } finally {
            stopLocaleSync();
        }
    });
});

const readStoredSettings = () => JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;

describe("Settings.vue groups", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    });

    it("should show the groups in order", () => {
        const wrapper = mountSettings();

        expect(wrapper.findAll("[data-testid^='settings-group-']").map(group => group.attributes("data-testid")))
            .toEqual(["settings-group-gameplay", "settings-group-appearance", "settings-group-language", "settings-group-about"]);
    });

    it("should show five gameplay tiles in order", () => {
        const wrapper = mountSettings();

        const tiles = wrapper.get("[data-testid='settings-group-gameplay']").findAll("[data-testid^='toggle-']");

        expect(tiles.map(tile => tile.attributes("data-testid"))).toEqual([
            "toggle-highlightSameDigit",
            "toggle-highlightScope",
            "toggle-completionFlash",
            "toggle-autoRemoveNotes",
            "toggle-showRemainingCount",
        ]);
        expect(tiles.map(tile => tile.attributes("aria-pressed"))).toEqual(["true", "true", "true", "true", "true"]);
    });

    it("should turn row, column and box highlighting off from its tile", async () => {
        const wrapper = mountSettings();

        await wrapper.get("[data-testid='toggle-highlightScope']").trigger("click");

        expect(useSettingsStore().highlightScope).toBe(false);
        expect(wrapper.get("[data-testid='toggle-highlightScope']").attributes("aria-pressed")).toBe("false");
        expect(readStoredSettings().highlightScope).toBe(false);
    });

    it.each(["highlightSameDigit", "completionFlash", "autoRemoveNotes", "showRemainingCount"] as const)(
        "should sync the %s tile with its setting",
        async (key) => {
            const wrapper = mountSettings();

            await wrapper.get(`[data-testid='toggle-${key}']`).trigger("click");

            expect(useSettingsStore()[key]).toBe(false);
            expect(wrapper.get(`[data-testid='toggle-${key}']`).attributes("aria-pressed")).toBe("false");
        },
    );
});

describe("Settings.vue color mode switcher", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    });

    it("should label the modes in English and Chinese", async () => {
        const wrapper = mountSettings();
        const labels = () => ["system", "light", "dark"].map(mode => wrapper.get(`[data-testid='appearance-${mode}']`).text());

        expect(labels()).toEqual(["System", "Light", "Dark"]);

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(labels()).toEqual(["跟隨系統", "淺色", "深色"]);
    });

    it("should mark system as selected by default", () => {
        const wrapper = mountSettings();

        expect(wrapper.get("[data-testid='appearance-system']").attributes("aria-pressed")).toBe("true");
    });

    it("should store dark when dark is chosen", async () => {
        const wrapper = mountSettings();

        await wrapper.get("[data-testid='appearance-dark']").trigger("click");

        expect(useSettingsStore().appearance).toBe("dark");
        const stored = JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
        expect(stored.appearance).toBe("dark");
    });
});
