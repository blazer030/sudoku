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
import { useGameStore } from "@/stores/gameStore";
import { useStatisticsStore } from "@/stores/statisticsStore";
import type { CellState, GameState } from "@/application/game/GameState";
import type { BillingService, Product } from "@/application/billing/BillingService";
import { getPalette } from "@/theme/palettes";
import { styleIconSvg } from "@/theme/styleIcons";
import type { StyleId } from "@/theme/themeIds";
import { ROUTER_PATH } from "@/router";
import Settings from "@/presentation/pages/settings/Settings.vue";
import { appVersion } from "@/utils/appVersion";
import { handleBackButton } from "@/presentation/composables/backDismissal";

const fakeProducts: Product[] = [
    { id: "donate_coffee", tier: "coffee", priceText: "$2.99", amountUsd: 2.99 },
];

const buildBilling = (loadProducts: BillingService["loadProducts"]): BillingService => ({
    loadProducts,
    purchase: vi.fn(),
    consumeAll: vi.fn().mockResolvedValue(undefined),
});

const mountSettingsWithRouter = (billing?: BillingService) => {
    setActivePinia(createPinia());
    if (billing !== undefined) useDonateStore().setBilling(billing);
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/", component: { template: "<div />" } },
            { path: "/settings", component: Settings },
            { path: "/settings/changelog", component: { template: "<div />" } },
            { path: "/settings/appearance", component: { template: "<div />" } },
            { path: "/donate", component: { template: "<div />" } },
        ],
    });
    return { router, wrapper: mount(Settings, { global: { plugins: [router] } }) };
};

const mountSettings = (billing?: BillingService) => mountSettingsWithRouter(billing).wrapper;

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
        expect(wrapper.get("[data-testid='settings-group-about']").find("[data-testid='donate-link']").exists()).toBe(true);
    });

    it("should mark each group's title for styles to decorate", async () => {
        const wrapper = mountSettings();
        await flushPromises();

        const heading = wrapper.get("[data-testid='settings-group-about']").get("h2");
        expect(heading.attributes("data-skin")).toBe("group-heading");
    });

    it("should keep the about rows in order", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings(buildBilling(vi.fn().mockResolvedValue(fakeProducts)));
        await flushPromises();

        const rows = wrapper.get("[data-testid='settings-group-about']").findAll("[data-testid]");

        expect(rows.map(row => row.attributes("data-testid"))).toEqual(["version-link", "privacy-policy-link", "donate-link"]);
        expect(wrapper.get("[data-testid='version-link']").text()).toContain(appVersion);
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

    it("should list Traditional Chinese before English", () => {
        const wrapper = mountSettings();
        const options = wrapper.find("[data-testid='language-switcher']").findAll("button");
        expect(options.map(option => option.attributes("data-testid"))).toEqual(["language-system", "language-zh-Hant", "language-en"]);
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
            .toEqual([
                "settings-group-gameplay",
                "settings-group-appearance",
                "settings-group-language",
                "settings-group-data",
                "settings-group-about",
            ]);
    });

    it("should show five gameplay tiles in order", () => {
        const wrapper = mountSettings();

        const tiles = wrapper.get("[data-testid='settings-group-gameplay']").findAll("[data-testid^='toggle-']");

        expect(tiles.map(tile => tile.attributes("data-testid"))).toEqual([
            "toggle-highlightSameDigit",
            "toggle-highlightScope",
            "toggle-motionEffects",
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

    it.each(["highlightSameDigit", "motionEffects", "autoRemoveNotes", "showRemainingCount"] as const)(
        "should sync the %s tile with its setting",
        async (key) => {
            const wrapper = mountSettings();

            await wrapper.get(`[data-testid='toggle-${key}']`).trigger("click");

            expect(useSettingsStore()[key]).toBe(false);
            expect(wrapper.get(`[data-testid='toggle-${key}']`).attributes("aria-pressed")).toBe("false");
        },
    );
});

describe("Settings.vue appearance row", () => {
    beforeEach(() => {
        localStorage.clear();
        // On native the launcher-icon tile would show too, if it were still here
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    });

    const t = i18n.global.t;
    const summaryOf = (wrapper: ReturnType<typeof mountSettings>) => wrapper.get("[data-testid='appearance-summary']").text();

    it("should hold a single row instead of the pickers", async () => {
        const wrapper = mountSettings();
        await flushPromises();

        expect(wrapper.get("[data-testid='settings-group-appearance']").findAll("[data-testid='appearance-row']")).toHaveLength(1);
        for (const moved of ["style-option-", "color-theme-", "appearance-switcher", "appearance-light", "toggle-matchLauncherIconToTheme"]) {
            expect(wrapper.find(`[data-testid^='${moved}']`).exists(), moved).toBe(false);
        }
    });

    it("should show the current style's icon in the current theme and mode, with its name", async () => {
        const wrapper = mountSettings();
        const settingsStore = useSettingsStore();
        const row = () => wrapper.get("[data-testid='appearance-row']");
        const expectIconFor = (style: StyleId) => {
            const palette = getPalette(style, settingsStore.colorTheme, settingsStore.appearance);
            const host = document.createElement("div");
            host.innerHTML = styleIconSvg(style, palette);
            expect(row().get(`[data-testid='style-icon-${style}'] svg`).element.outerHTML).toBe(host.innerHTML.trim());
            expect(row().text()).toContain(t(`settings.style.names.${style}`));
        };

        expectIconFor("minimal");

        settingsStore.setStyle("tactile");
        settingsStore.setAppearance("dark");
        await nextTick();

        expectIconFor("tactile");
        expect(row().find("[data-testid='style-icon-minimal']").exists()).toBe(false);
    });

    it("should leave the icon to the style name beside it for screen readers", () => {
        const wrapper = mountSettings();

        expect(wrapper.get("[data-testid='appearance-row'] [data-testid='style-icon-minimal']").attributes("aria-hidden")).toBe("true");
    });

    it("should summarise the mode and theme and follow both", async () => {
        const wrapper = mountSettings();
        const settingsStore = useSettingsStore();
        const lightGreen = summaryOf(wrapper);
        expect(lightGreen).toContain(t("settings.colorMode.light"));
        expect(lightGreen).toContain(t("settings.colorThemes.green"));

        settingsStore.setAppearance("dark");
        await nextTick();
        const darkGreen = summaryOf(wrapper);
        expect(darkGreen).not.toBe(lightGreen);
        expect(darkGreen).toContain(t("settings.colorMode.dark"));

        settingsStore.setColorTheme("blue");
        await nextTick();
        expect(summaryOf(wrapper)).not.toBe(darkGreen);
        expect(summaryOf(wrapper)).toContain(t("settings.colorThemes.blue"));
    });

    it("should show only the theme for a one-mode style", async () => {
        const wrapper = mountSettings();
        const settingsStore = useSettingsStore();
        settingsStore.setStyle("paper");
        await nextTick();

        expect(summaryOf(wrapper)).toBe(t(`settings.colorThemes.${settingsStore.colorTheme}`));
    });

    it("should keep a one-mode style's summary while dark is stored", async () => {
        const wrapper = mountSettings();
        const settingsStore = useSettingsStore();
        settingsStore.setStyle("paper");
        settingsStore.setAppearance("light");
        await nextTick();
        const light = summaryOf(wrapper);

        settingsStore.setAppearance("dark");
        await nextTick();

        expect(summaryOf(wrapper)).toBe(light);
        expect(settingsStore.appearance).toBe("dark");
    });

    it("should show only the mode, in the style's own name, for a one-theme style", async () => {
        const wrapper = mountSettings();
        const settingsStore = useSettingsStore();
        settingsStore.setStyle("pixel");
        settingsStore.setAppearance("dark");
        await nextTick();

        expect(summaryOf(wrapper)).toBe(t("settings.colorMode.styled.pixel.dark"));
        expect(summaryOf(wrapper)).not.toContain(t("settings.colorThemes.classic"));
    });

    it.each([
        { style: "cyber", themeId: "neon" },
        { style: "ink", themeId: "vermilion" },
    ] as const)("should show only the style's name for $style, with one mode and one theme", async ({ style, themeId }) => {
        const wrapper = mountSettings();
        const settingsStore = useSettingsStore();
        settingsStore.setStyle(style);
        await nextTick();

        expect(summaryOf(wrapper)).toBe(t(`settings.style.names.${style}`));
        expect(summaryOf(wrapper)).not.toContain(t(`settings.colorThemes.${themeId}`));
    });

    it("should open the appearance page", async () => {
        const { router, wrapper } = mountSettingsWithRouter();

        await wrapper.get("[data-testid='appearance-row']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.appearance);
    });

    it("should switch the row's words with the language", async () => {
        const wrapper = mountSettings();
        const english = wrapper.get("[data-testid='appearance-row']").text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(wrapper.get("[data-testid='appearance-row']").text()).not.toBe(english);
    });
});

const dummySave: GameState = {
    difficulty: "easy",
    answer: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0)),
    cells: Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, (): CellState => ({ clue: 0, entry: 0, notes: [] }))
    ),
    elapsedSeconds: 204,
    completed: false,
    hintsUsed: 0,
};

const recordOneGame = () => {
    useStatisticsStore().recordGame({ difficulty: "easy", elapsedSeconds: 120, completed: true });
};

describe("Settings.vue data group", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    });

    it("should disable clearing when there are no records", () => {
        const wrapper = mountSettings();

        expect(wrapper.get("[data-testid='settings-group-data']").get("[data-testid='clear-records-button']").attributes())
            .toHaveProperty("disabled");
    });

    it("should be a quiet text button", async () => {
        const wrapper = mountSettings();
        recordOneGame();
        await nextTick();

        const button = wrapper.get("[data-testid='clear-records-button']");
        expect(button.attributes()).not.toHaveProperty("disabled");
        expect(button.classes()).toContain("text-danger");
        expect(button.classes()).not.toContain("bg-danger");
        expect(button.classes()).not.toContain("border-danger");
    });

    it("should say what clearing deletes and keeps", async () => {
        const wrapper = mountSettings();
        recordOneGame();
        await nextTick();

        await wrapper.get("[data-testid='clear-records-button']").trigger("click");

        expect(wrapper.get("[data-testid='clear-records-dialog']").text()).toContain(
            "All game records, including their reviews, plus your win rate and best times will be permanently deleted. "
            + "This can't be undone. Your unfinished game and settings are kept.",
        );
    });

    it("should clear records on confirm", async () => {
        const wrapper = mountSettings();
        recordOneGame();
        await nextTick();

        await wrapper.get("[data-testid='clear-records-button']").trigger("click");
        await wrapper.get("[data-testid='clear-records-confirm-button']").trigger("click");
        await flushPromises();

        expect(useStatisticsStore().history).toHaveLength(0);
    });

    it("should keep records on cancel", async () => {
        const wrapper = mountSettings();
        recordOneGame();
        await nextTick();

        await wrapper.get("[data-testid='clear-records-button']").trigger("click");
        await wrapper.get("[data-testid='clear-records-cancel-button']").trigger("click");
        await flushPromises();

        expect(useStatisticsStore().history).toHaveLength(1);
    });

    it("should keep records when Back closes the clear records dialog", async () => {
        const wrapper = mountSettings();
        recordOneGame();
        await nextTick();

        await wrapper.get("[data-testid='clear-records-button']").trigger("click");
        handleBackButton(false);
        await flushPromises();

        expect(wrapper.find("[data-testid='clear-records-dialog']").exists()).toBe(false);
        expect(useStatisticsStore().history).toHaveLength(1);
    });

    it("should keep the unfinished game and settings when clearing records", async () => {
        const wrapper = mountSettings();
        useGameStore().persistGame(dummySave);
        useSettingsStore().setColorTheme("blue");
        recordOneGame();
        await nextTick();

        await wrapper.get("[data-testid='clear-records-button']").trigger("click");
        await wrapper.get("[data-testid='clear-records-confirm-button']").trigger("click");
        await flushPromises();

        expect(useGameStore().savedGame).not.toBeNull();
        expect(useSettingsStore().colorTheme).toBe("blue");
        expect(readStoredSettings().colorTheme).toBe("blue");
        expect(wrapper.get("[data-testid='clear-records-button']").attributes()).toHaveProperty("disabled");
    });
});

describe("Settings.vue about group", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    });

    it("should link to the privacy policy in a new window", () => {
        const wrapper = mountSettings();
        const link = wrapper.get("[data-testid='privacy-policy-link']");

        expect(link.attributes("href")).toBe("https://blazer030.github.io/sudoku/privacy-policy.html");
        expect(link.attributes("target")).toBe("_blank");
        expect(link.attributes("rel")).toContain("noopener");
        expect(link.text()).toBe("Privacy Policy");
    });
});
