import { nextTick, ref } from "vue";
import type { Mock } from "vitest";
import { resolveColorMode, startAppearanceSync } from "@/presentation/theme/appearanceSync";
import { getPalette } from "@/theme/palettes";
import type { Appearance, ColorMode, ColorThemeId, StyleId } from "@/application/SettingsStorage";
import type { SystemBarService } from "@/application/systemBar/SystemBarService";
import type { AppearanceBridgeService, SystemBarColors } from "@/application/appearanceBridge/AppearanceBridgeService";

describe("startAppearanceSync", () => {
    let stop: (() => void) | undefined;
    let meta: HTMLMetaElement;
    let systemBar: SystemBarService & { apply: Mock<(mode: ColorMode) => Promise<void>> };
    let appearanceBridge: AppearanceBridgeService & {
        setAppearance: Mock<(mode: Appearance) => Promise<void>>;
        setSystemBarColors: Mock<(colors: SystemBarColors) => Promise<void>>;
    };

    const buildSources = (colorTheme: ColorThemeId = "green", appearance: Appearance = "light") => ({
        appearance: ref<Appearance>(appearance),
        style: ref<StyleId>("minimal"),
        colorTheme: ref<ColorThemeId>(colorTheme),
    });

    const mockSystemDark = (initial: boolean) => {
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

    const isDark = () => document.documentElement.classList.contains("dark");

    const stylesheetHrefs = (): string[] =>
        [...document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map(link => link.getAttribute("href") ?? "");

    beforeEach(() => {
        const apply = vi.fn<(mode: ColorMode) => Promise<void>>().mockResolvedValue(undefined);
        systemBar = { apply };
        appearanceBridge = {
            setAppearance: vi.fn<(mode: Appearance) => Promise<void>>().mockResolvedValue(undefined),
            setSystemBarColors: vi.fn<(colors: SystemBarColors) => Promise<void>>().mockResolvedValue(undefined),
        };
        meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
    });

    afterEach(() => {
        stop?.();
        stop = undefined;
        meta.remove();
        document.head.querySelectorAll('link[rel="stylesheet"]').forEach((link) => { link.remove(); });
        vi.unstubAllGlobals();
        document.documentElement.className = "";
        delete document.documentElement.dataset.style;
        delete document.documentElement.dataset.colorTheme;
    });

    describe("favicon", () => {
        let favicon: HTMLLinkElement;

        beforeEach(() => {
            favicon = document.createElement("link");
            favicon.rel = "icon";
            document.head.appendChild(favicon);
        });

        afterEach(() => {
            favicon.remove();
        });

        it("should show the theme's icon in the mode on screen", async () => {
            const sources = buildSources("blue", "light");
            stop = startAppearanceSync(sources, systemBar, appearanceBridge);
            expect(favicon.href).toMatch(/\/sudoku-blue\.svg$/);

            sources.appearance.value = "dark";
            await nextTick();
            expect(favicon.href).toMatch(/\/sudoku-minimalBlueDark\.svg$/);

            // Every style's theme has its own icon
            sources.style.value = "tactile";
            sources.colorTheme.value = "rust";
            await nextTick();
            expect(favicon.href).toMatch(/\/sudoku-tactileRustDark\.svg$/);

            sources.appearance.value = "light";
            await nextTick();
            expect(favicon.href).toMatch(/\/sudoku-tactileRust\.svg$/);
        });

        it("should follow the system's light or dark when the appearance is system", () => {
            const setSystemDark = mockSystemDark(true);
            stop = startAppearanceSync(buildSources("teal", "system"), systemBar, appearanceBridge);
            expect(favicon.href).toMatch(/\/sudoku-minimalTealDark\.svg$/);

            setSystemDark(false);
            expect(favicon.href).toMatch(/\/sudoku-teal\.svg$/);
        });
    });

    it("should set data-color-theme on start", () => {
        stop = startAppearanceSync(buildSources(), systemBar, appearanceBridge);

        expect(document.documentElement.dataset.colorTheme).toBe("green");
    });

    it("should update data-color-theme and theme-color when the color theme changes", async () => {
        const sources = buildSources();
        stop = startAppearanceSync(sources, systemBar, appearanceBridge);

        sources.colorTheme.value = "purple";
        await nextTick();

        expect(document.documentElement.dataset.colorTheme).toBe("purple");
        expect(meta.content).toBe(getPalette("minimal", "purple", "light").primary);
    });

    describe("resolveColorMode", () => {
        it("should follow the system only for system", () => {
            expect(resolveColorMode("system", true)).toBe("dark");
            expect(resolveColorMode("system", false)).toBe("light");
            expect(resolveColorMode("light", true)).toBe("light");
            expect(resolveColorMode("dark", false)).toBe("dark");
        });
    });

    it("should apply the system mode immediately", () => {
        mockSystemDark(true);

        stop = startAppearanceSync(buildSources("green", "system"), systemBar, appearanceBridge);

        expect(isDark()).toBe(true);
        expect(document.documentElement.dataset.style).toBe("minimal");
        expect(document.documentElement.dataset.colorTheme).toBe("green");
    });

    it("should switch when the appearance changes", async () => {
        mockSystemDark(true);
        const sources = buildSources("green", "system");
        stop = startAppearanceSync(sources, systemBar, appearanceBridge);

        sources.appearance.value = "light";
        await nextTick();

        expect(isDark()).toBe(false);
    });

    it("should follow system changes while appearance is system", () => {
        const setSystemDark = mockSystemDark(false);
        stop = startAppearanceSync(buildSources("green", "system"), systemBar, appearanceBridge);
        expect(isDark()).toBe(false);

        setSystemDark(true);

        expect(isDark()).toBe(true);
    });

    it("should ignore system changes while a mode is chosen", () => {
        const setSystemDark = mockSystemDark(true);
        stop = startAppearanceSync(buildSources("green", "dark"), systemBar, appearanceBridge);

        setSystemDark(false);

        expect(isDark()).toBe(true);
    });

    it("should pick up the current system mode when switching back to system", async () => {
        const setSystemDark = mockSystemDark(true);
        const sources = buildSources("green", "dark");
        stop = startAppearanceSync(sources, systemBar, appearanceBridge);

        setSystemDark(false);
        sources.appearance.value = "system";
        await nextTick();

        expect(isDark()).toBe(false);
    });

    it("should set theme-color to the dark background in dark mode", () => {
        mockSystemDark(false);

        stop = startAppearanceSync(buildSources("green", "dark"), systemBar, appearanceBridge);

        expect(meta.content).toBe(getPalette("minimal", "green", "dark").background);
    });

    it("should treat a missing matchMedia as a light system", () => {
        vi.stubGlobal("matchMedia", undefined);

        expect(() => { stop = startAppearanceSync(buildSources("green", "system"), systemBar, appearanceBridge); }).not.toThrow();
        expect(isDark()).toBe(false);
    });

    it("should stop following the system after stop", () => {
        const setSystemDark = mockSystemDark(false);
        stop = startAppearanceSync(buildSources("green", "system"), systemBar, appearanceBridge);

        stop();
        stop = undefined;
        setSystemDark(true);

        expect(isDark()).toBe(false);
    });

    it("should match the Android system bars to the mode", async () => {
        mockSystemDark(false);
        const sources = buildSources("green", "light");
        stop = startAppearanceSync(sources, systemBar, appearanceBridge);
        expect(systemBar.apply).toHaveBeenLastCalledWith("light");

        sources.appearance.value = "dark";
        await nextTick();

        expect(systemBar.apply).toHaveBeenLastCalledWith("dark");
    });

    it("should hand the appearance setting to the Android shell at start and on every change", async () => {
        mockSystemDark(true);
        const sources = buildSources("green", "system");
        stop = startAppearanceSync(sources, systemBar, appearanceBridge);
        // The setting itself, not the resolved mode, so a cold start can keep following the system
        expect(appearanceBridge.setAppearance).toHaveBeenLastCalledWith("system");

        sources.appearance.value = "light";
        await nextTick();

        expect(appearanceBridge.setAppearance).toHaveBeenLastCalledWith("light");
    });

    it("should colour the Android system bars with the page background and icons that read on it", async () => {
        const setSystemDark = mockSystemDark(false);
        const sources = buildSources("green", "system");
        stop = startAppearanceSync(sources, systemBar, appearanceBridge);
        expect(appearanceBridge.setSystemBarColors).toHaveBeenLastCalledWith({
            background: getPalette("minimal", "green", "light").background,
            darkIcons: true,
        });

        setSystemDark(true);

        expect(appearanceBridge.setSystemBarColors).toHaveBeenLastCalledWith({
            background: getPalette("minimal", "green", "dark").background,
            darkIcons: false,
        });

        appearanceBridge.setSystemBarColors.mockClear();
        sources.colorTheme.value = "purple";
        await nextTick();

        expect(appearanceBridge.setSystemBarColors).toHaveBeenLastCalledWith({
            background: getPalette("minimal", "purple", "dark").background,
            darkIcons: false,
        });
    });

    it("should follow the system through addListener on WebViews without addEventListener", () => {
        let matches = false;
        const listeners: ((event: MediaQueryListEvent) => void)[] = [];
        vi.stubGlobal("matchMedia", (query: string) => ({
            get matches() { return matches; },
            media: query,
            addListener: (listener: (event: MediaQueryListEvent) => void) => { listeners.push(listener); },
            removeListener: vi.fn(),
        }));

        stop = startAppearanceSync(buildSources("green", "system"), systemBar, appearanceBridge);
        matches = true;
        listeners.forEach((listener) => { listener({ matches: true } as MediaQueryListEvent); });

        expect(isDark()).toBe(true);
    });

    describe("paper fonts", () => {
        it("should add no font stylesheet whatever the style, since the fonts are bundled", async () => {
            const sources = buildSources();
            stop = startAppearanceSync(sources, systemBar, appearanceBridge);

            for (const style of ["paper", "tactile", "minimal"] as const) {
                sources.style.value = style;
                await nextTick();
                expect(stylesheetHrefs(), style).toEqual([]);
            }
        });

        // load() resolves once finishLoadingFonts() runs, as the browser would after fetching Caveat
        let finishLoading: (() => void)[] = [];
        const stubFontLoading = (matchedFaces: number) => {
            const load = vi.fn((_font: string, _text?: string) => new Promise((resolve) => {
                finishLoading.push(() => { resolve(Array.from({ length: matchedFaces }, () => ({ status: "loaded" }))); });
            }));
            Object.defineProperty(document, "fonts", { configurable: true, value: { load } });
            return load;
        };

        const finishLoadingFonts = async () => {
            finishLoading.forEach((finish) => { finish(); });
            finishLoading = [];
            await new Promise((resolve) => { setTimeout(resolve, 0); });
        };

        const fontsState = () => document.documentElement.dataset.paperFonts;

        afterEach(() => {
            Reflect.deleteProperty(document, "fonts");
            delete document.documentElement.dataset.paperFonts;
        });

        it("should mark paper's fonts ready once Caveat's digits have loaded", async () => {
            const load = stubFontLoading(1);
            const sources = buildSources();
            sources.style.value = "paper";
            stop = startAppearanceSync(sources, systemBar, appearanceBridge);
            expect(fontsState()).toBeUndefined();

            await finishLoadingFonts();

            expect(load).toHaveBeenCalledWith(expect.stringMatching(/^700 .*Caveat/), "0123456789");
            expect(fontsState()).toBe("ready");
        });

        it("should leave paper at the fallback size when no Caveat face loads", async () => {
            // A WebView that cannot read the bundled face: load() matches nothing
            stubFontLoading(0);
            const sources = buildSources();
            sources.style.value = "paper";
            stop = startAppearanceSync(sources, systemBar, appearanceBridge);

            await finishLoadingFonts();

            expect(fontsState()).toBeUndefined();
        });

        it("should drop the ready mark when leaving paper", async () => {
            stubFontLoading(1);
            const sources = buildSources();
            sources.style.value = "paper";
            stop = startAppearanceSync(sources, systemBar, appearanceBridge);
            await finishLoadingFonts();

            sources.style.value = "minimal";
            await nextTick();

            expect(fontsState()).toBeUndefined();
        });

        it("should not mark fonts ready after the player has left paper", async () => {
            stubFontLoading(1);
            const sources = buildSources();
            sources.style.value = "paper";
            stop = startAppearanceSync(sources, systemBar, appearanceBridge);

            sources.style.value = "tactile";
            await nextTick();
            await finishLoadingFonts();

            expect(fontsState()).toBeUndefined();
        });
    });
});
