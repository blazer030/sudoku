import { nextTick } from "vue";
import { createPinia, setActivePinia, storeToRefs } from "pinia";
import type { Mock } from "vitest";
import { useSettingsStore } from "@/stores/settingsStore";
import { startLauncherIconSync } from "@/presentation/theme/launcherIconSync";
import { ICON_THEME_IDS, STYLE_IDS, THEME_IDS_BY_STYLE } from "@/application/SettingsStorage";
import type { IconThemeId } from "@/application/SettingsStorage";

describe("startLauncherIconSync", () => {
    let stop: (() => void) | undefined;
    let setIcon: Mock<(iconTheme: IconThemeId) => Promise<void>>;

    const start = () => {
        const store = useSettingsStore();
        stop = startLauncherIconSync(storeToRefs(store), { setIcon });
        return store;
    };

    beforeEach(() => {
        localStorage.clear();
        setActivePinia(createPinia());
        setIcon = vi.fn<(iconTheme: IconThemeId) => Promise<void>>().mockResolvedValue(undefined);
    });

    afterEach(() => {
        stop?.();
        stop = undefined;
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

    it("should send the nearest icon when the style changes", async () => {
        const store = start();
        store.setColorTheme("teal");
        store.setMatchLauncherIconToTheme(true);
        await nextTick();
        setIcon.mockClear();

        store.setStyle("tactile");
        await nextTick();
        expect(setIcon).toHaveBeenLastCalledWith("green");

        store.setColorTheme("rust");
        await nextTick();
        expect(setIcon).toHaveBeenLastCalledWith("orange");
    });

    it("should never hand a non-icon id to the icon service", async () => {
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
        for (const [iconTheme] of setIcon.mock.calls) {
            expect(ICON_THEME_IDS).toContain(iconTheme);
        }
    });
});
