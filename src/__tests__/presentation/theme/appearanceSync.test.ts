import { nextTick, ref } from "vue";
import { resolveColorMode, startAppearanceSync } from "@/presentation/theme/appearanceSync";
import { getPalette } from "@/theme/palettes";
import type { Appearance, ColorThemeId, StyleId } from "@/application/SettingsStorage";

describe("startAppearanceSync", () => {
    let stop: (() => void) | undefined;
    let meta: HTMLMetaElement;

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

    beforeEach(() => {
        meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
    });

    afterEach(() => {
        stop?.();
        stop = undefined;
        meta.remove();
        vi.unstubAllGlobals();
        document.documentElement.className = "";
        delete document.documentElement.dataset.style;
        delete document.documentElement.dataset.colorTheme;
    });

    it("should set data-color-theme on start", () => {
        stop = startAppearanceSync(buildSources());

        expect(document.documentElement.dataset.colorTheme).toBe("green");
    });

    it("should update data-color-theme and theme-color when the color theme changes", async () => {
        const sources = buildSources();
        stop = startAppearanceSync(sources);

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

        stop = startAppearanceSync(buildSources("green", "system"));

        expect(isDark()).toBe(true);
        expect(document.documentElement.dataset.style).toBe("minimal");
        expect(document.documentElement.dataset.colorTheme).toBe("green");
    });

    it("should switch when the appearance changes", async () => {
        mockSystemDark(true);
        const sources = buildSources("green", "system");
        stop = startAppearanceSync(sources);

        sources.appearance.value = "light";
        await nextTick();

        expect(isDark()).toBe(false);
    });

    it("should follow system changes while appearance is system", () => {
        const setSystemDark = mockSystemDark(false);
        stop = startAppearanceSync(buildSources("green", "system"));
        expect(isDark()).toBe(false);

        setSystemDark(true);

        expect(isDark()).toBe(true);
    });

    it("should ignore system changes while a mode is chosen", () => {
        const setSystemDark = mockSystemDark(true);
        stop = startAppearanceSync(buildSources("green", "dark"));

        setSystemDark(false);

        expect(isDark()).toBe(true);
    });

    it("should pick up the current system mode when switching back to system", async () => {
        const setSystemDark = mockSystemDark(true);
        const sources = buildSources("green", "dark");
        stop = startAppearanceSync(sources);

        setSystemDark(false);
        sources.appearance.value = "system";
        await nextTick();

        expect(isDark()).toBe(false);
    });

    it("should set theme-color to the dark background in dark mode", () => {
        mockSystemDark(false);

        stop = startAppearanceSync(buildSources("green", "dark"));

        expect(meta.content).toBe(getPalette("minimal", "green", "dark").background);
    });

    it("should treat a missing matchMedia as a light system", () => {
        vi.stubGlobal("matchMedia", undefined);

        expect(() => { stop = startAppearanceSync(buildSources("green", "system")); }).not.toThrow();
        expect(isDark()).toBe(false);
    });

    it("should stop following the system after stop", () => {
        const setSystemDark = mockSystemDark(false);
        stop = startAppearanceSync(buildSources("green", "system"));

        stop();
        stop = undefined;
        setSystemDark(true);

        expect(isDark()).toBe(false);
    });
});
