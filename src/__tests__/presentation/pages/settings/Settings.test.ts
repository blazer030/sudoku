import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
import { startAppearanceSync } from "@/presentation/theme/appearanceSync";
import { startLauncherIconSync } from "@/presentation/theme/launcherIconSync";
import { STYLES, getPalette, rememberedThemeFor } from "@/theme/palettes";
import { STYLE_IDS } from "@/theme/themeIds";
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
        expect(wrapper.get("[data-testid='settings-group-about']").find("[data-testid='donate-link']").exists()).toBe(true);
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
        const stopLauncherIconSync = startLauncherIconSync(storeToRefs(settingsStore), { setIcon });
        try {
            await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");

            expect(setIcon).toHaveBeenCalledWith(settingsStore.colorTheme);
        } finally {
            stopLauncherIconSync();
        }
    });

    it("disables the setting when toggling from ON", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings();
        await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");
        await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");

        expect(useSettingsStore().matchLauncherIconToTheme).toBe(false);
    });

    it("shows the toggle as an unpressed tile inside the appearance group", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings();

        const tile = wrapper.get("[data-testid='settings-group-appearance']").get("[data-testid='toggle-matchLauncherIconToTheme']");

        expect(tile.attributes("aria-pressed")).toBe("false");
    });

    it("explains that the icon updates after leaving the app", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings();
        expect(wrapper.text()).toContain("The icon updates after you leave the app");
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

describe("Settings.vue appearance group", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    });

    it("should show the minimal style as the selected style card", () => {
        const wrapper = mountSettings();
        const card = wrapper.get("[data-testid='style-option-minimal']");

        expect(card.attributes("aria-pressed")).toBe("true");
        expect(card.text()).toContain("Minimal Motion");
        expect(card.find("[data-testid='style-thumbnail']").exists()).toBe(true);
    });

    it("should not re-apply the style or theme that is already selected", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings();
        const settingsStore = useSettingsStore();
        const setIcon = vi.fn().mockResolvedValue(undefined);
        const stopLauncherIconSync = startLauncherIconSync(storeToRefs(settingsStore), { setIcon });
        settingsStore.setMatchLauncherIconToTheme(true);
        await nextTick();
        setIcon.mockClear();
        const setStyle = vi.spyOn(settingsStore, "setStyle");
        const setColorTheme = vi.spyOn(settingsStore, "setColorTheme");

        await wrapper.get(`[data-testid='style-option-${settingsStore.style}']`).trigger("click");
        await wrapper.get(`[data-testid='color-theme-${settingsStore.colorTheme}']`).trigger("click");

        expect(setStyle).not.toHaveBeenCalled();
        expect(setColorTheme).not.toHaveBeenCalled();
        expect(setIcon).not.toHaveBeenCalled();
        stopLauncherIconSync();
    });

    it("should list the current style's themes with names and state", () => {
        const wrapper = mountSettings();

        expect(wrapper.findAll("button[data-testid^='color-theme-']")).toHaveLength(STYLES.minimal.themes.length);
        const blue = wrapper.get("[data-testid='color-theme-blue']");
        expect(blue.attributes("aria-label")).toBe("Blue");
        expect(blue.attributes("aria-pressed")).toBe("false");
        expect(wrapper.get("[data-testid='color-theme-green']").attributes("aria-pressed")).toBe("true");
    });

    describe("colour-theme swatches", () => {
        // jsdom reports inline colours as rgb(); run the expected hex through the same parser
        const cssColor = (hex: string): string => {
            const probe = document.createElement("div");
            probe.style.color = hex;
            return probe.style.color;
        };

        const stubSystemDark = (initial: boolean) => {
            let matches = initial;
            const listeners = new Set<(event: MediaQueryListEvent) => void>();
            vi.stubGlobal("matchMedia", (query: string) => ({
                get matches() { return query === "(prefers-color-scheme: dark)" && matches; },
                media: query,
                addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => { listeners.add(listener); },
                removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => { listeners.delete(listener); },
            }));
            return (value: boolean) => {
                matches = value;
                listeners.forEach((listener) => { listener({ matches: value } as MediaQueryListEvent); });
            };
        };

        afterEach(() => {
            vi.unstubAllGlobals();
        });

        const expectSwatchesIn = (wrapper: ReturnType<typeof mountSettings>, mode: "light" | "dark") => {
            const settingsStore = useSettingsStore();
            for (const theme of STYLES[settingsStore.style].themes) {
                const palette = getPalette(settingsStore.style, theme.id, mode);
                const swatch = wrapper.get(`[data-testid='color-theme-${theme.id}']`);
                const label = `${settingsStore.style} ${theme.id} in ${mode}`;
                expect((swatch.element as HTMLElement).style.backgroundColor, label).toBe(cssColor(palette.primary));
                // One solid colour: no second half in the accent
                expect(swatch.html(), label).not.toContain(cssColor(palette.accent));
                expect(swatch.findAll("[style*='background']"), label).toHaveLength(0);
            }
            const check = wrapper.get("[data-testid='color-theme-check']");
            const selected = getPalette(settingsStore.style, settingsStore.colorTheme, mode);
            expect((check.element as HTMLElement).style.color).toBe(cssColor(selected["on-primary"]));
        };

        it("should fill each swatch with its light primary in light mode", () => {
            stubSystemDark(true);
            localStorage.setItem("sudoku-settings", JSON.stringify({ appearance: "light" }));

            expectSwatchesIn(mountSettings(), "light");
        });

        it("should fill each swatch with its dark primary in dark mode, for every style", async () => {
            stubSystemDark(false);
            const wrapper = mountSettings();
            const settingsStore = useSettingsStore();
            settingsStore.setAppearance("dark");

            for (const style of STYLE_IDS) {
                settingsStore.setStyle(style);
                await nextTick();
                expectSwatchesIn(wrapper, "dark");
            }
        });

        it("should follow the system's light or dark when the appearance is system", async () => {
            const setSystemDark = stubSystemDark(true);
            const wrapper = mountSettings();
            expect(useSettingsStore().appearance).toBe("system");

            expectSwatchesIn(wrapper, "dark");

            setSystemDark(false);
            await nextTick();
            expectSwatchesIn(wrapper, "light");
        });
    });

    it("should switch light and dark live", async () => {
        const wrapper = mountSettings();
        const stopAppearanceSync = startAppearanceSync(
            storeToRefs(useSettingsStore()),
            { apply: vi.fn().mockResolvedValue(undefined) },
            { setAppearance: vi.fn().mockResolvedValue(undefined), setSystemBarColors: vi.fn().mockResolvedValue(undefined) },
        );
        try {
            await wrapper.get("[data-testid='appearance-dark']").trigger("click");
            expect(document.documentElement.classList.contains("dark")).toBe(true);

            await wrapper.get("[data-testid='appearance-light']").trigger("click");
            expect(document.documentElement.classList.contains("dark")).toBe(false);
        } finally {
            stopAppearanceSync();
            document.documentElement.className = "";
        }
    });

    it("should show a thumbnail for each of the three styles", () => {
        const wrapper = mountSettings();
        const cards = wrapper.findAll("button[data-testid^='style-option-']");

        expect(cards.map(card => card.attributes("data-testid"))).toEqual(["style-option-minimal", "style-option-tactile", "style-option-paper"]);
        // The thumbnail is hidden from screen readers; the card's name is its last text
        const names = wrapper.findAll("button[data-testid^='style-option-'] > span").map(name => name.text());
        expect(names).toEqual(["Minimal Motion", "Tactile Tiles", "Paper Notebook"]);
        for (const style of STYLE_IDS) {
            const thumbnail = wrapper.get(`[data-testid='style-option-${style}'] [data-testid='style-thumbnail']`);
            const primary = getPalette(style, rememberedThemeFor(style, useSettingsStore().colorThemeByStyle), "light").primary;
            expect(thumbnail.attributes("data-thumbnail-style")).toBe(style);
            expect(thumbnail.attributes("style")?.toUpperCase()).toContain(`--COLOR-PRIMARY: ${primary}`);
        }
    });

    it("should draw each thumbnail in its own style's faces whatever style is active", () => {
        // Paper points --font-sans at WenKai on <html>; the other thumbnails must not inherit it
        const expectedSans: Record<string, string> = {
            minimal: "--font-sans: var(--font-default)",
            tactile: "--font-sans: var(--font-default)",
            paper: "--font-sans: var(--font-wenkai)",
        };
        for (const activeStyle of STYLE_IDS) {
            localStorage.setItem("sudoku-settings", JSON.stringify({ style: activeStyle }));
            const wrapper = mountSettings();
            expect(useSettingsStore().style).toBe(activeStyle);

            for (const style of STYLE_IDS) {
                const thumbnail = wrapper.get(`[data-testid='style-option-${style}'] [data-testid='style-thumbnail']`);
                expect(thumbnail.attributes("style"), `${style} while ${activeStyle} is active`).toContain(expectedSans[style]);
            }
            wrapper.unmount();
        }
    });

    it("should keep style hooks out of thumbnails", () => {
        const wrapper = mountSettings();

        for (const thumbnail of wrapper.findAll("[data-testid='style-thumbnail']")) {
            expect(thumbnail.findAll("[data-style], [data-skin]")).toHaveLength(0);
            expect(thumbnail.attributes("data-style")).toBeUndefined();
            expect(thumbnail.attributes("data-skin")).toBeUndefined();
        }
    });

    it("should switch styles live and remember each style's theme", async () => {
        const wrapper = mountSettings();
        const stopAppearanceSync = startAppearanceSync(
            storeToRefs(useSettingsStore()),
            { apply: vi.fn().mockResolvedValue(undefined) },
            { setAppearance: vi.fn().mockResolvedValue(undefined), setSystemBarColors: vi.fn().mockResolvedValue(undefined) },
        );
        const root = document.documentElement;
        const swatchCount = () => wrapper.findAll("button[data-testid^='color-theme-']").length;
        const pressed = (theme: string) => wrapper.get(`[data-testid='color-theme-${theme}']`).attributes("aria-pressed");
        try {
            await wrapper.get("[data-testid='style-option-tactile']").trigger("click");
            expect(root.dataset.style).toBe("tactile");
            expect(root.dataset.colorTheme).toBe("green");
            expect(swatchCount()).toBe(4);
            expect(wrapper.get("[data-testid='color-theme-rust']").attributes("aria-label")).toBe("Rust");

            await wrapper.get("[data-testid='color-theme-rust']").trigger("click");

            await wrapper.get("[data-testid='style-option-paper']").trigger("click");
            expect(swatchCount()).toBe(3);
            expect(pressed("blueInk")).toBe("true");
            await wrapper.get("[data-testid='color-theme-redInk']").trigger("click");

            await wrapper.get("[data-testid='style-option-tactile']").trigger("click");
            expect(pressed("rust")).toBe("true");
            expect(root.dataset.colorTheme).toBe("rust");

            await wrapper.get("[data-testid='style-option-paper']").trigger("click");
            expect(root.dataset.colorTheme).toBe("redInk");

            await wrapper.get("[data-testid='style-option-minimal']").trigger("click");
            expect(root.dataset.style).toBe("minimal");
            expect(root.dataset.colorTheme).toBe("green");
        } finally {
            stopAppearanceSync();
            document.documentElement.className = "";
        }
    });

    it("should keep a single appearance control inside the appearance group", () => {
        const wrapper = mountSettings();

        expect(wrapper.findAll("[data-testid='appearance-switcher']")).toHaveLength(1);
        expect(wrapper.get("[data-testid='settings-group-appearance']").find("[data-testid='appearance-switcher']").exists()).toBe(true);
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

describe("Settings.vue color mode switcher", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    });

    it("should label the modes", () => {
        const wrapper = mountSettings();
        const labels = ["system", "light", "dark"].map(mode => wrapper.get(`[data-testid='appearance-${mode}']`).text());

        expect(labels).toEqual(["System", "Light", "Dark"]);
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
