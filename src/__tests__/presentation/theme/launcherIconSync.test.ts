import { nextTick } from "vue";
import { createPinia, setActivePinia, storeToRefs } from "pinia";
import type { Mock } from "vitest";
import { useSettingsStore } from "@/stores/settingsStore";
import { startLauncherIconSync } from "@/presentation/theme/launcherIconSync";
import { STYLE_IDS, THEME_IDS_BY_STYLE } from "@/theme/themeIds";
import { LAUNCHER_ICONS, type LauncherIconKey } from "@/theme/launcherIcon";

describe("startLauncherIconSync", () => {
    let stop: (() => void) | undefined;
    let setIcon: Mock<(icon: LauncherIconKey) => Promise<void>>;

    const start = () => {
        const store = useSettingsStore();
        stop = startLauncherIconSync(storeToRefs(store), { setIcon });
        return store;
    };

    beforeEach(() => {
        localStorage.clear();
        setActivePinia(createPinia());
        setIcon = vi.fn<(icon: LauncherIconKey) => Promise<void>>().mockResolvedValue(undefined);
    });

    afterEach(() => {
        stop?.();
        stop = undefined;
        vi.unstubAllGlobals();
    });

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

    const startMatching = async () => {
        const store = start();
        store.setMatchLauncherIconToTheme(true);
        await nextTick();
        setIcon.mockClear();
        return store;
    };

    it.each([
        ["light", false, "green"],
        ["light", true, "green"],
        ["dark", false, "minimalGreenDark"],
        ["dark", true, "minimalGreenDark"],
        ["system", false, "green"],
        ["system", true, "minimalGreenDark"],
    ] as const)("should pick the %s appearance's icon when the system is dark: %s", async (appearance, systemDark, expected) => {
        stubSystemDark(systemDark);
        const store = start();
        store.setAppearance(appearance);

        store.setMatchLauncherIconToTheme(true);
        await nextTick();

        expect(setIcon).toHaveBeenLastCalledWith(expected);
    });

    it("should re-target the icon when only the appearance changes", async () => {
        stubSystemDark(false);
        const store = await startMatching();

        store.setAppearance("dark");
        await nextTick();
        expect(setIcon).toHaveBeenLastCalledWith("minimalGreenDark");

        store.setAppearance("light");
        await nextTick();
        expect(setIcon).toHaveBeenLastCalledWith("green");
        expect(setIcon).toHaveBeenCalledTimes(2);
    });

    it("should follow the system's light or dark while the appearance is system", async () => {
        const setSystemDark = stubSystemDark(false);
        await startMatching();

        setSystemDark(true);
        await nextTick();
        expect(setIcon).toHaveBeenLastCalledWith("minimalGreenDark");

        setSystemDark(false);
        await nextTick();
        expect(setIcon).toHaveBeenLastCalledWith("green");
    });

    it("should leave the icon alone on appearance changes while matching is off", async () => {
        const setSystemDark = stubSystemDark(false);
        const store = start();

        store.setAppearance("dark");
        setSystemDark(true);
        await nextTick();

        expect(setIcon).not.toHaveBeenCalled();
    });

    // The mode may have changed while the app was closed
    it("should send the current icon on start when matching is on", () => {
        stubSystemDark(true);
        localStorage.setItem("sudoku-settings", JSON.stringify({ matchLauncherIconToTheme: true, style: "paper", colorTheme: "redInk" }));

        start();

        expect(setIcon).toHaveBeenCalledExactlyOnceWith("paperRedInkDark");
    });

    it("should send the theme's icon when the theme changes while matching is on", async () => {
        const store = start();
        store.setMatchLauncherIconToTheme(true);
        await nextTick();
        setIcon.mockClear();

        store.setColorTheme("blue");
        await nextTick();

        expect(setIcon).toHaveBeenCalledWith("blue");
    });

    it("should leave the icon alone when the theme changes while matching is off", async () => {
        const store = start();

        store.setColorTheme("blue");
        await nextTick();

        expect(setIcon).not.toHaveBeenCalled();
    });

    it("should send the current theme's icon when matching turns on", async () => {
        const store = start();
        store.setColorTheme("purple");
        await nextTick();

        store.setMatchLauncherIconToTheme(true);
        await nextTick();

        expect(setIcon).toHaveBeenCalledWith("purple");
    });

    it("should leave the icon alone when matching turns off", async () => {
        const store = start();
        store.setMatchLauncherIconToTheme(true);
        await nextTick();
        setIcon.mockClear();

        store.setMatchLauncherIconToTheme(false);
        await nextTick();

        expect(setIcon).not.toHaveBeenCalled();
    });

    it("should send the style's own icon when the style changes", async () => {
        const store = start();
        store.setColorTheme("teal");
        store.setMatchLauncherIconToTheme(true);
        await nextTick();
        setIcon.mockClear();

        store.setStyle("tactile");
        await nextTick();
        expect(setIcon).toHaveBeenLastCalledWith("tactileGreen");

        store.setColorTheme("rust");
        await nextTick();
        expect(setIcon).toHaveBeenLastCalledWith("tactileRust");
    });

    it("should only hand the icon service keys that have an icon", async () => {
        const store = start();
        store.setMatchLauncherIconToTheme(true);

        for (const style of STYLE_IDS) {
            store.setStyle(style);
            for (const theme of THEME_IDS_BY_STYLE[style]) {
                store.setColorTheme(theme);
                await nextTick();
            }
        }

        expect(setIcon.mock.calls.length).toBeGreaterThan(0);
        const keys = LAUNCHER_ICONS.map(icon => icon.key);
        for (const [icon] of setIcon.mock.calls) {
            expect(keys).toContain(icon);
        }
    });
});
