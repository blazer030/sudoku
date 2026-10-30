import { nextTick } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia, storeToRefs } from "pinia";
import { createMemoryHistory, createRouter, createWebHistory, RouterView } from "vue-router";

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
import { useSettingsStore } from "@/stores/settingsStore";
import { startAppearanceSync } from "@/presentation/theme/appearanceSync";
import { startLauncherIconSync } from "@/presentation/theme/launcherIconSync";
import { handleBackButton } from "@/presentation/composables/backDismissal";
import { STYLES, getPalette, rememberedAppearanceFor, rememberedThemeFor, swatchColors, type Palette } from "@/theme/palettes";
import { styleIconSvg } from "@/theme/styleIcons";
import { STYLE_IDS, type StyleId } from "@/theme/themeIds";
import Appearance from "@/presentation/pages/settings/Appearance.vue";
import Settings from "@/presentation/pages/settings/Settings.vue";

const t = i18n.global.t;

const mountAppearance = () => {
    setActivePinia(createPinia());
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/", component: { template: "<div />" } },
            { path: "/settings", component: { template: "<div />" } },
            { path: "/settings/appearance", component: Appearance },
        ],
    });
    return mount(Appearance, { global: { plugins: [router] } });
};

const startSync = () => startAppearanceSync(
    storeToRefs(useSettingsStore()),
    { apply: vi.fn().mockResolvedValue(undefined) },
    { setAppearance: vi.fn().mockResolvedValue(undefined), setSystemBarColors: vi.fn().mockResolvedValue(undefined) },
);

// The icon's markup as the DOM serialises it
const svgOf = (style: StyleId, palette: Palette, idSuffix = "") => {
    const host = document.createElement("div");
    host.innerHTML = styleIconSvg(style, palette, idSuffix);
    return host.innerHTML.trim();
};

// The icon the settings should have drawn. A card's ids carry its own suffix, so the expected icon takes it from the rendered one.
const iconSvgFor = (style: StyleId, rendered: string) => {
    const settingsStore = useSettingsStore();
    const idSuffix = /id="(?:cyber-edge|aurora-light-1|ink-rough|chalk-grain)-([^"]+)"/.exec(rendered)?.[1];
    return svgOf(style, getPalette(style, rememberedThemeFor(style, settingsStore.colorThemeByStyle), rememberedAppearanceFor(style, settingsStore.appearanceByStyle)), idSuffix);
};

describe("Appearance.vue style cards", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    });

    it("should list every style, each with its app icon and name", () => {
        const wrapper = mountAppearance();
        const cards = wrapper.findAll("button[data-testid^='style-option-']");

        expect(cards.map(card => card.attributes("data-testid"))).toEqual(["style-option-minimal", "style-option-tactile", "style-option-paper", "style-option-pixel", "style-option-cyber", "style-option-ink", "style-option-chalkboard", "style-option-blueprint", "style-option-aurora"]);
        for (const style of STYLE_IDS) {
            const card = wrapper.get(`[data-testid='style-option-${style}']`);
            const rendered = card.get(`[data-testid='style-icon-${style}'] svg`).element.outerHTML;
            expect(rendered, style).toBe(iconSvgFor(style, rendered));
            expect(card.text(), style).toBe(t(`settings.style.names.${style}`));
        }
    });

    it("should draw each card's icon in the style's own theme and the current mode", async () => {
        const wrapper = mountAppearance();
        const settingsStore = useSettingsStore();
        settingsStore.setStyle("tactile");
        settingsStore.setColorTheme("rust");
        settingsStore.setAppearance("dark");
        settingsStore.setStyle("minimal");
        settingsStore.setAppearance("dark");
        await nextTick();

        for (const style of STYLE_IDS) {
            const rendered = wrapper.get(`[data-testid='style-icon-${style}'] svg`).element.outerHTML;
            expect(rendered, style).toBe(iconSvgFor(style, rendered));
        }
        expect(wrapper.get("[data-testid='style-icon-tactile'] svg").element.outerHTML)
            .toBe(svgOf("tactile", getPalette("tactile", "rust", "dark")));
    });

    it("should draw each card's icon in the mode remembered for that style", async () => {
        const wrapper = mountAppearance();
        const settingsStore = useSettingsStore();
        settingsStore.setStyle("chalkboard");
        settingsStore.setAppearance("light");
        settingsStore.setStyle("minimal");
        settingsStore.setAppearance("dark");
        await nextTick();

        expect(wrapper.get("[data-testid='style-icon-chalkboard'] svg").element.outerHTML)
            .toBe(svgOf("chalkboard", getPalette("chalkboard", "classic", "light")));
        expect(wrapper.get("[data-testid='style-icon-minimal'] svg").element.outerHTML)
            .toBe(svgOf("minimal", getPalette("minimal", "green", "dark")));
        expect(wrapper.get("[data-testid='style-icon-pixel'] svg").element.outerHTML)
            .toBe(svgOf("pixel", getPalette("pixel", "classic", "light")));
    });

    it("should leave the icon to the card's name for screen readers", () => {
        const wrapper = mountAppearance();

        for (const style of STYLE_IDS) {
            expect(wrapper.get(`[data-testid='style-icon-${style}']`).attributes("aria-hidden"), style).toBe("true");
        }
    });

    it("should show the minimal style as the selected card", () => {
        const wrapper = mountAppearance();

        expect(wrapper.get("[data-testid='style-option-minimal']").attributes("aria-pressed")).toBe("true");
        expect(wrapper.get("[data-testid='style-option-tactile']").attributes("aria-pressed")).toBe("false");
    });

    it("should switch styles at once and remember each style's theme", async () => {
        const wrapper = mountAppearance();
        const stopAppearanceSync = startSync();
        const root = document.documentElement;
        const swatchCount = () => wrapper.findAll("button[data-testid^='color-theme-']").length;
        const pressed = (theme: string) => wrapper.get(`[data-testid='color-theme-${theme}']`).attributes("aria-pressed");
        try {
            await wrapper.get("[data-testid='style-option-tactile']").trigger("click");
            expect(root.dataset.style).toBe("tactile");
            expect(root.dataset.colorTheme).toBe("green");
            expect(wrapper.get("[data-testid='style-option-tactile']").attributes("aria-pressed")).toBe("true");
            expect(swatchCount()).toBe(4);
            expect(wrapper.get("[data-testid='color-theme-rust']").attributes("aria-label")).toBe(t("settings.colorThemes.rust"));

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

    it("should not re-apply the style or theme that is already selected", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountAppearance();
        const settingsStore = useSettingsStore();
        const setIcon = vi.fn().mockResolvedValue(undefined);
        const stopLauncherIconSync = startLauncherIconSync(storeToRefs(settingsStore), { setIcon, resetIcon: vi.fn().mockResolvedValue(undefined) });
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
});

describe("Appearance.vue colour-theme swatches", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    });

    // jsdom reports inline colours as rgb(); run the expected hex through the same parser
    const cssColor = (hex: string): string => {
        const probe = document.createElement("div");
        probe.style.color = hex;
        return probe.style.color;
    };

    const expectSwatchesIn = (wrapper: ReturnType<typeof mountAppearance>, mode: "light" | "dark") => {
        const settingsStore = useSettingsStore();
        // A one-theme style has nothing to pick, so it draws no swatch
        if (STYLES[settingsStore.style].themes.length < 2) {
            expect(wrapper.findAll("button[data-testid^='color-theme-']"), settingsStore.style).toHaveLength(0);
            return;
        }
        for (const theme of STYLES[settingsStore.style].themes) {
            const palette = getPalette(settingsStore.style, theme.id, mode);
            const swatch = wrapper.get(`[data-testid='color-theme-${theme.id}']`);
            const label = `${settingsStore.style} ${theme.id} in ${mode}`;
            const { fill, mark } = swatchColors(settingsStore.style, mode, palette);
            expect((swatch.element as HTMLElement).style.backgroundColor, label).toBe(cssColor(fill));
            // One solid colour: no second half in the accent (blueprint's accent is its ink and aurora's is its primary, so it may be the fill or the mark)
            const accentMayBeDrawn = ["blueprint", "aurora"].includes(settingsStore.style) && (palette.accent === fill || palette.accent === mark);
            if (!accentMayBeDrawn) expect(swatch.html(), label).not.toContain(cssColor(palette.accent));
            expect(swatch.findAll("[style*='background']"), label).toHaveLength(0);
        }
        const check = wrapper.get("[data-testid='color-theme-check']");
        const selected = getPalette(settingsStore.style, settingsStore.colorTheme, mode);
        expect((check.element as HTMLElement).style.color).toBe(cssColor(swatchColors(settingsStore.style, mode, selected).mark));
    };

    it("should list the current style's themes with names and state", () => {
        const wrapper = mountAppearance();

        expect(wrapper.findAll("button[data-testid^='color-theme-']")).toHaveLength(STYLES.minimal.themes.length);
        const blue = wrapper.get("[data-testid='color-theme-blue']");
        expect(blue.attributes("aria-label")).toBe(t("settings.colorThemes.blue"));
        expect(blue.attributes("aria-pressed")).toBe("false");
        expect(wrapper.get("[data-testid='color-theme-green']").attributes("aria-pressed")).toBe("true");
    });

    it("should fill each swatch with its light primary in light mode", () => {
        localStorage.setItem("sudoku-settings", JSON.stringify({ appearance: "light" }));

        expectSwatchesIn(mountAppearance(), "light");
    });

    it("should fill each swatch with its dark primary in dark mode, for every style", async () => {
        const wrapper = mountAppearance();
        const settingsStore = useSettingsStore();

        for (const style of STYLE_IDS) {
            settingsStore.setStyle(style);
            settingsStore.setAppearance("dark");
            await nextTick();
            expectSwatchesIn(wrapper, "dark");
        }
    });

    it("should tell blueprint's four swatches apart in both modes", async () => {
        const wrapper = mountAppearance();
        const settingsStore = useSettingsStore();
        settingsStore.setStyle("blueprint");

        for (const mode of ["dark", "light"] as const) {
            settingsStore.setAppearance(mode);
            await nextTick();
            const fills = STYLES.blueprint.themes.map(theme => (wrapper.get(`[data-testid='color-theme-${theme.id}']`).element as HTMLElement).style.backgroundColor);
            expect(new Set(fills).size, mode).toBe(4);
        }
        for (const theme of STYLES.blueprint.themes) {
            expect(wrapper.get(`[data-testid='color-theme-${theme.id}']`).attributes("data-skin"), theme.id).toBe("swatch");
        }
    });

    it("should apply a theme at once", async () => {
        const wrapper = mountAppearance();
        const stopAppearanceSync = startSync();
        try {
            await wrapper.get("[data-testid='color-theme-blue']").trigger("click");

            expect(useSettingsStore().colorTheme).toBe("blue");
            expect(document.documentElement.dataset.colorTheme).toBe("blue");
        } finally {
            stopAppearanceSync();
            document.documentElement.className = "";
        }
    });
});

describe("Appearance.vue light and dark", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    });

    it("should offer exactly light and dark", () => {
        const wrapper = mountAppearance();

        const options = wrapper.get("[data-testid='appearance-switcher']").findAll("button");

        expect(options.map(option => option.attributes("data-testid"))).toEqual(["appearance-light", "appearance-dark"]);
        expect(options.map(option => option.text())).toEqual([t("settings.colorMode.light"), t("settings.colorMode.dark")]);
        expect(wrapper.get("[data-testid='appearance-light']").attributes("aria-pressed")).toBe("true");
    });

    it("should switch light and dark at once and store the choice", async () => {
        const wrapper = mountAppearance();
        const stopAppearanceSync = startSync();
        try {
            await wrapper.get("[data-testid='appearance-dark']").trigger("click");
            expect(document.documentElement.classList.contains("dark")).toBe(true);
            const stored = JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
            expect(stored.appearance).toBe("dark");

            await wrapper.get("[data-testid='appearance-light']").trigger("click");
            expect(document.documentElement.classList.contains("dark")).toBe(false);
        } finally {
            stopAppearanceSync();
            document.documentElement.className = "";
        }
    });

    it("should leave out light and dark for a one-mode style, and bring back the other style's own mode", async () => {
        const wrapper = mountAppearance();
        const settingsStore = useSettingsStore();
        settingsStore.setAppearance("dark");

        await wrapper.get("[data-testid='style-option-paper']").trigger("click");

        expect(wrapper.find("[data-testid='appearance-mode-label']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='appearance-switcher']").exists()).toBe(false);
        expect(settingsStore.appearance).toBe("light");

        await wrapper.get("[data-testid='style-option-minimal']").trigger("click");

        expect(wrapper.find("[data-testid='appearance-mode-label']").exists()).toBe(true);
        expect(wrapper.get("[data-testid='appearance-dark']").attributes("aria-pressed")).toBe("true");
    });
});

describe("Appearance.vue match-launcher-icon toggle", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(Capacitor.isNativePlatform).mockReset();
    });

    it("hides the toggle on web", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
        const wrapper = mountAppearance();
        expect(wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").exists()).toBe(false);
    });

    it("shows the toggle on native as a wide unpressed tile in the styles card, after the styles", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountAppearance();

        const tile = wrapper.get("[data-testid='appearance-style-card']").get("[data-testid='toggle-matchLauncherIconToTheme']");

        expect(tile.attributes("aria-pressed")).toBe("false");
        const order = wrapper.findAll("[data-testid='style-option-pixel'], [data-testid='toggle-matchLauncherIconToTheme']")
            .map(element => element.attributes("data-testid"));
        expect(order).toEqual(["style-option-pixel", "toggle-matchLauncherIconToTheme"]);
    });

    it("enables the setting immediately without a confirm dialog", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountAppearance();
        await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");

        expect(wrapper.find("[data-testid='icon-dialog-confirm']").exists()).toBe(false);
        expect(useSettingsStore().matchLauncherIconToTheme).toBe(true);
    });

    it("asks the icon service to apply the current theme when enabled", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountAppearance();
        const setIcon = vi.fn().mockResolvedValue(undefined);
        const settingsStore = useSettingsStore();
        const stopLauncherIconSync = startLauncherIconSync(storeToRefs(settingsStore), { setIcon, resetIcon: vi.fn().mockResolvedValue(undefined) });
        try {
            await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");

            expect(setIcon).toHaveBeenCalledWith(settingsStore.colorTheme);
        } finally {
            stopLauncherIconSync();
        }
    });

    it("disables the setting when toggling from ON", async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountAppearance();
        await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");
        await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");

        expect(useSettingsStore().matchLauncherIconToTheme).toBe(false);
    });

    it("explains that the icon updates after leaving the app", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountAppearance();
        expect(wrapper.get("[data-testid='toggle-matchLauncherIconToTheme']").text()).toContain(t("settings.matchLauncherIconNote"));
    });
});

describe("Appearance.vue language", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    });

    it("should switch the page's words with the language", async () => {
        const wrapper = mountAppearance();
        const english = wrapper.text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(wrapper.text()).not.toBe(english);
        expect(wrapper.get("[data-testid='style-option-minimal']").text()).not.toBe(t("settings.style.names.minimal", {}, { locale: "en" }));
    });
});

describe("Appearance.vue going back", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    });

    // Real browser history, as on Android: the system Back key goes through window.history
    const openFromSettings = async () => {
        setActivePinia(createPinia());
        const router = createRouter({
            history: createWebHistory(),
            routes: [
                { path: "/", component: { template: "<div data-testid='home' />" } },
                { path: "/settings", component: Settings },
                { path: "/settings/appearance", component: Appearance },
            ],
        });
        await router.push("/");
        await router.push("/settings");
        const wrapper = mount(RouterView, { global: { plugins: [router] } });
        await flushPromises();
        await wrapper.get("[data-testid='appearance-row']").trigger("click");
        await flushPromises();
        expect(router.currentRoute.value.path).toBe("/settings/appearance");
        return { router, wrapper };
    };

    const afterPopState = async (goBack: () => void) => {
        const popped = new Promise((resolve) => { window.addEventListener("popstate", resolve, { once: true }); });
        goBack();
        await popped;
        await flushPromises();
    };

    it("should return to Settings from the header's back button", async () => {
        const { router, wrapper } = await openFromSettings();

        await afterPopState(() => { void wrapper.get("[data-testid='back-button']").trigger("click"); });

        expect(router.currentRoute.value.path).toBe("/settings");
        expect(wrapper.find("[data-testid='appearance-row']").exists()).toBe(true);
    });

    it("should return to Settings, not Home, on the system Back key", async () => {
        const { router, wrapper } = await openFromSettings();

        await afterPopState(() => { handleBackButton(true); });

        expect(router.currentRoute.value.path).toBe("/settings");
        expect(wrapper.find("[data-testid='home']").exists()).toBe(false);
    });
});

describe("Appearance.vue one-theme style", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    });

    afterEach(() => {
        i18n.global.locale.value = "en";
    });

    it("should show the theme heading and swatches for a style with several themes", () => {
        const wrapper = mountAppearance();

        expect(wrapper.find("[data-testid='appearance-theme-label']").exists()).toBe(true);
        expect(wrapper.findAll("button[data-testid^='color-theme-']")).toHaveLength(6);
    });

    it("should hide the theme heading and swatch for a style with one theme", async () => {
        const wrapper = mountAppearance();
        useSettingsStore().setStyle("pixel");
        await nextTick();

        expect(wrapper.find("[data-testid='appearance-theme-label']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='color-theme-classic']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='appearance-mode-label']").exists()).toBe(true);
    });

    it("should leave out the whole colours card for the dark-only, one-theme cyber", async () => {
        const wrapper = mountAppearance();
        useSettingsStore().setStyle("cyber");
        await nextTick();

        expect(wrapper.find("[data-testid='appearance-colours-card']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='appearance-mode-label']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='appearance-light']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='appearance-dark']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='appearance-theme-label']").exists()).toBe(false);
    });

    it("should hide the colour-mode control and the theme heading for the light-only, one-theme ink", async () => {
        const wrapper = mountAppearance();
        useSettingsStore().setStyle("ink");
        await nextTick();

        expect(wrapper.find("[data-testid='appearance-mode-label']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='appearance-light']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='appearance-dark']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='appearance-theme-label']").exists()).toBe(false);
    });

    it("should put the colour theme and light/dark in a card of their own, apart from the styles", () => {
        const wrapper = mountAppearance();
        const stylesCard = wrapper.get("[data-testid='appearance-style-card']");
        const coloursCard = wrapper.get("[data-testid='appearance-colours-card']");

        expect(stylesCard.find("[data-testid='style-option-minimal']").exists()).toBe(true);
        expect(stylesCard.find("[data-testid='appearance-theme-label']").exists()).toBe(false);
        expect(coloursCard.find("[data-testid='appearance-theme-label']").exists()).toBe(true);
        expect(coloursCard.find("[data-testid='appearance-switcher']").exists()).toBe(true);
        expect(coloursCard.attributes("data-skin")?.split(" ")).toContain("card");
    });

    it("should name the modes in the style's own words, in either language", async () => {
        const wrapper = mountAppearance();
        const modeTexts = () => ["appearance-light", "appearance-dark"].map(id => wrapper.get(`[data-testid='${id}']`).text());
        const minimalEnglish = modeTexts();
        useSettingsStore().setStyle("pixel");
        await nextTick();
        const pixelEnglish = modeTexts();
        i18n.global.locale.value = "zh-Hant";
        await nextTick();
        const pixelChinese = modeTexts();

        expect(pixelEnglish).not.toEqual(minimalEnglish);
        expect(pixelChinese).not.toEqual(pixelEnglish);
    });

    // Review Focus 1: chalkboard's modes read 黑板 and 白板, never plain dark and light
    it("should name chalkboard's modes in its own words, in either language, with no theme picker", async () => {
        const wrapper = mountAppearance();
        const modeTexts = () => ["appearance-light", "appearance-dark"].map(id => wrapper.get(`[data-testid='${id}']`).text());
        const minimalEnglish = modeTexts();
        useSettingsStore().setStyle("chalkboard");
        await nextTick();
        const chalkboardEnglish = modeTexts();
        i18n.global.locale.value = "zh-Hant";
        await nextTick();
        const chalkboardChinese = modeTexts();

        expect(chalkboardEnglish).not.toEqual(minimalEnglish);
        expect(chalkboardChinese).not.toEqual(chalkboardEnglish);
        expect(wrapper.find("[data-testid='appearance-theme-label']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='color-theme-classic']").exists()).toBe(false);
    });

    // Review Focus 1: blueprint's modes read 藍曬圖 and 製圖紙, and its four papers each have a swatch
    it("should name blueprint's modes in its own words, in either language, beside its four papers", async () => {
        const wrapper = mountAppearance();
        const modeTexts = () => ["appearance-light", "appearance-dark"].map(id => wrapper.get(`[data-testid='${id}']`).text());
        const minimalEnglish = modeTexts();
        useSettingsStore().setStyle("blueprint");
        await nextTick();
        const blueprintEnglish = modeTexts();
        i18n.global.locale.value = "zh-Hant";
        await nextTick();
        const blueprintChinese = modeTexts();

        expect(blueprintEnglish).not.toEqual(minimalEnglish);
        expect(blueprintChinese).not.toEqual(blueprintEnglish);
        expect(wrapper.findAll("button[data-testid^='color-theme-']").map(swatch => swatch.attributes("data-testid")))
            .toEqual(["color-theme-blue", "color-theme-teal", "color-theme-slate", "color-theme-rust"]);
    });

    it("should name aurora's modes in its own words, in either language, beside its four colours painted as their primaries", async () => {
        const wrapper = mountAppearance();
        const modeTexts = () => ["appearance-light", "appearance-dark"].map(id => wrapper.get(`[data-testid='${id}']`).text());
        const minimalEnglish = modeTexts();
        const settingsStore = useSettingsStore();
        settingsStore.setStyle("aurora");
        await nextTick();
        const auroraEnglish = modeTexts();
        i18n.global.locale.value = "zh-Hant";
        await nextTick();
        const auroraChinese = modeTexts();

        expect(auroraEnglish).not.toEqual(minimalEnglish);
        expect(auroraChinese).not.toEqual(auroraEnglish);
        expect(wrapper.findAll("button[data-testid^='color-theme-']").map(swatch => swatch.attributes("data-testid")))
            .toEqual(["color-theme-purple", "color-theme-teal", "color-theme-pink", "color-theme-orange"]);
        for (const theme of STYLES.aurora.themes) {
            const swatch = wrapper.get(`[data-testid='color-theme-${theme.id}']`).element as HTMLElement;
            const probe = document.createElement("div");
            probe.style.backgroundColor = getPalette("aurora", theme.id, "dark").primary;
            expect(swatch.style.backgroundColor, theme.id).toBe(probe.style.backgroundColor);
        }
    });

    it("should bring minimal back to the theme last chosen there after a visit to pixel", () => {
        mountAppearance();
        const settingsStore = useSettingsStore();
        settingsStore.setColorTheme("blue");
        settingsStore.setStyle("pixel");
        expect(settingsStore.colorTheme).toBe("classic");

        settingsStore.setStyle("minimal");

        expect(settingsStore.colorTheme).toBe("blue");
    });
});
