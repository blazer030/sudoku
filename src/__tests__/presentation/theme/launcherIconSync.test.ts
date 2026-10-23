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
    });

    const startMatching = async () => {
        const store = start();
        store.setMatchLauncherIconToTheme(true);
        await nextTick();
        setIcon.mockClear();
        return store;
    };

    it.each([
        ["minimal", "green", "light", "green"],
        ["minimal", "green", "dark", "minimalGreenDark"],
        ["tactile", "rust", "dark", "tactileRustDark"],
        ["paper", "blueInk", "light", "paperBlueInk"],
        ["paper", "blueInk", "dark", "paperBlueInk"],
    ] as const)("should pick the %s style's %s icon for the stored %s appearance: %s", async (style, colorTheme, appearance, expected) => {
        const store = start();
        store.setStyle(style);
        store.setColorTheme(colorTheme);
        store.setAppearance(appearance);

        store.setMatchLauncherIconToTheme(true);
        await nextTick();

        expect(setIcon).toHaveBeenLastCalledWith(expected);
    });

    it("should re-target the icon when only the appearance changes", async () => {
        const store = await startMatching();

        store.setAppearance("dark");
        await nextTick();
        expect(setIcon).toHaveBeenLastCalledWith("minimalGreenDark");

        store.setAppearance("light");
        await nextTick();
        expect(setIcon).toHaveBeenLastCalledWith("green");
        expect(setIcon).toHaveBeenCalledTimes(2);
    });

    it("should not re-send paper's icon when the appearance changes", async () => {
        const store = start();
        store.setStyle("paper");
        store.setMatchLauncherIconToTheme(true);
        await nextTick();
        setIcon.mockClear();

        store.setAppearance("dark");
        await nextTick();

        expect(setIcon).not.toHaveBeenCalled();
    });

    it("should send the dark icon when the style changes from paper to minimal while dark is stored", async () => {
        const store = start();
        store.setAppearance("dark");
        store.setStyle("paper");
        store.setMatchLauncherIconToTheme(true);
        await nextTick();
        setIcon.mockClear();

        store.setStyle("minimal");
        await nextTick();

        expect(setIcon).toHaveBeenLastCalledWith("minimalGreenDark");
    });

    it("should leave the icon alone on appearance changes while matching is off", async () => {
        const store = start();

        store.setAppearance("dark");
        await nextTick();

        expect(setIcon).not.toHaveBeenCalled();
    });

    // The mode may have changed while the app was closed
    it("should send the current icon on start when matching is on", () => {
        localStorage.setItem("sudoku-settings", JSON.stringify({ matchLauncherIconToTheme: true, style: "paper", colorTheme: "redInk", appearance: "dark" }));

        start();

        expect(setIcon).toHaveBeenCalledExactlyOnceWith("paperRedInk");
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
