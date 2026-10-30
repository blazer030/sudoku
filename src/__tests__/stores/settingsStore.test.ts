import { createPinia, setActivePinia } from "pinia";
import { useSettingsStore } from "@/stores/settingsStore";
import { updateManifestLink, updateAppleTouchIcon } from "@/application/PwaThemeUpdater";
import { STYLE_IDS, THEME_IDS_BY_STYLE } from "@/theme/themeIds";
import { pwaIconKey } from "@/theme/launcherIcon";

// Spies that still update the page links, so tests can read the hrefs too
vi.mock("@/application/PwaThemeUpdater", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/application/PwaThemeUpdater")>();
    return {
        updateMetaThemeColor: vi.fn(),
        updateManifestLink: vi.fn(actual.updateManifestLink),
        updateAppleTouchIcon: vi.fn(actual.updateAppleTouchIcon),
    };
});

// The favicon also depends on light or dark, so appearanceSync owns it (appearanceSync.test.ts)
const ICON_LINK_RELS = ["manifest", "apple-touch-icon"] as const;

describe("settingsStore", () => {
    beforeEach(() => {
        localStorage.clear();
        setActivePinia(createPinia());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should initialise with defaults when the saved settings are the JSON text null", () => {
        localStorage.setItem("sudoku-settings", "null");

        const store = useSettingsStore();

        expect(store.style).toBe("minimal");
        expect(store.appearance).toBe("light");
    });

    it("should initialise with defaults when the saved settings are not valid JSON", () => {
        localStorage.setItem("sudoku-settings", "{\"style\": \"paper\"");

        const store = useSettingsStore();

        expect(store.style).toBe("minimal");
        expect(store.appearance).toBe("light");
    });

    it("should have default values on first load", () => {
        const store = useSettingsStore();

        expect(store.colorTheme).toBe("green");
        expect(store.highlightSameDigit).toBe(true);
        expect(store.motionEffects).toBe(true);
        expect(store.autoRemoveNotes).toBe(true);
        expect(store.showRemainingCount).toBe(true);
        expect(store.matchLauncherIconToTheme).toBe(false);
        expect(store.language).toBe("system");
        expect(store.appearance).toBe("light");
        expect(store.style).toBe("minimal");
    });

    it.each([
        ["appearance", (store: ReturnType<typeof useSettingsStore>) => { store.setAppearance("dark"); }, "dark"],
        ["highlightScope", (store: ReturnType<typeof useSettingsStore>) => { store.setHighlightScope(false); }, false],
        ["language", (store: ReturnType<typeof useSettingsStore>) => { store.setLanguage("zh-Hant"); }, "zh-Hant"],
    ] as const)("should persist a %s change and restore it in a new store", (key, change, expected) => {
        change(useSettingsStore());

        const stored = JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
        expect(stored[key]).toBe(expected);
        setActivePinia(createPinia());
        expect(useSettingsStore()[key]).toBe(expected);
    });

    it("should remember the theme chosen for the current style", () => {
        const store = useSettingsStore();

        store.setColorTheme("teal");

        const stored = JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
        expect(stored.colorThemeByStyle).toEqual({ minimal: "teal" });
        setActivePinia(createPinia());
        expect(useSettingsStore().colorThemeByStyle.minimal).toBe("teal");
    });

    it("should keep an upgraded player's theme when the current style is chosen again", () => {
        localStorage.setItem("sudoku-settings", JSON.stringify({ colorTheme: "blue" }));
        const store = useSettingsStore();

        store.setStyle("minimal");

        expect(store.colorTheme).toBe("blue");
        expect(store.style).toBe("minimal");
    });

    it("should remember light or dark separately for each style", () => {
        const store = useSettingsStore();
        const stored = () => JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
        store.setAppearance("dark");

        store.setStyle("chalkboard");
        expect(store.appearance).toBe("dark");
        expect(stored().appearance).toBe("dark");

        store.setStyle("minimal");
        expect(store.appearance).toBe("dark");

        store.setStyle("chalkboard");
        store.setAppearance("light");
        expect(stored().appearanceByStyle).toEqual({ minimal: "dark", chalkboard: "light" });

        store.setStyle("pixel");
        expect(store.appearance).toBe("light");

        store.setStyle("chalkboard");
        expect(store.appearance).toBe("light");
        store.setStyle("paper");
        expect(store.appearance).toBe("light");
        store.setStyle("cyber");
        expect(store.appearance).toBe("dark");
        expect(stored().appearance).toBe("dark");

        setActivePinia(createPinia());
        const reloaded = useSettingsStore();
        expect(reloaded.appearance).toBe("dark");
        reloaded.setStyle("chalkboard");
        expect(reloaded.appearance).toBe("light");
        reloaded.setStyle("minimal");
        expect(reloaded.appearance).toBe("dark");
    });

    it("should start a style never chosen before in its first mode", () => {
        const store = useSettingsStore();
        store.setAppearance("light");

        store.setStyle("chalkboard");

        expect(store.appearance).toBe("dark");
    });

    it("should start blueprint in 藍曬圖 on its blue paper the first time it is chosen", () => {
        const store = useSettingsStore();
        store.setAppearance("light");
        store.setColorTheme("teal");

        store.setStyle("blueprint");

        expect(store.appearance).toBe("dark");
        expect(store.colorTheme).toBe("blue");
    });

    it("should keep a light appearance through a visit to the dark-only cyber", () => {
        const store = useSettingsStore();
        store.setAppearance("light");
        store.setColorTheme("blue");

        store.setStyle("cyber");
        store.setStyle("minimal");

        expect(store.appearance).toBe("light");
        expect(store.colorTheme).toBe("blue");
    });

    // Review Focus 4: ink never writes the appearance, so leaving it brings dark back
    it("should keep a dark appearance through a visit to the light-only ink", () => {
        const store = useSettingsStore();
        store.setAppearance("dark");

        store.setStyle("ink");
        store.setStyle("minimal");

        expect(store.appearance).toBe("dark");
    });

    it("should persist the chosen style", () => {
        const store = useSettingsStore();

        store.setStyle("minimal");

        const stored = JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
        expect(stored.style).toBe("minimal");
    });

    it("should persist colorTheme change to localStorage", () => {
        const store = useSettingsStore();

        store.setColorTheme("blue");

        expect(store.colorTheme).toBe("blue");
        const stored = JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
        expect(stored.colorTheme).toBe("blue");
    });

    it("should persist boolean setting changes to localStorage", () => {
        const store = useSettingsStore();

        store.setHighlightSameDigit(false);
        store.setMotionEffects(false);
        store.setAutoRemoveNotes(false);
        store.setShowRemainingCount(false);

        expect(store.highlightSameDigit).toBe(false);
        expect(store.motionEffects).toBe(false);
        expect(store.autoRemoveNotes).toBe(false);
        expect(store.showRemainingCount).toBe(false);

        const stored = JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
        expect(stored.highlightSameDigit).toBe(false);
        expect(stored.motionEffects).toBe(false);
    });

    it("should call PwaThemeUpdater functions when setting color theme", () => {
        const store = useSettingsStore();

        store.setColorTheme("blue");

        expect(updateManifestLink).toHaveBeenCalledWith("blue");
        expect(updateAppleTouchIcon).toHaveBeenCalledWith("blue");
    });

    describe("with the page's icon links", () => {
        beforeEach(() => {
            for (const rel of ICON_LINK_RELS) {
                const link = document.createElement("link");
                link.rel = rel;
                document.head.appendChild(link);
            }
        });

        afterEach(() => {
            for (const rel of ICON_LINK_RELS) document.head.querySelector(`link[rel="${rel}"]`)?.remove();
        });

        const linkHref = (rel: string): string => document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)?.href ?? "";

        it("should point the links at the style's own light icon when the style changes", () => {
            const store = useSettingsStore();
            store.setColorTheme("teal");

            store.setStyle("tactile");
            expect(linkHref("manifest")).toMatch(/manifest-tactileGreen\.webmanifest$/);
            expect(linkHref("apple-touch-icon")).toMatch(/apple-touch-icon-tactileGreen\.png$/);

            store.setColorTheme("rust");
            expect(linkHref("manifest")).toMatch(/manifest-tactileRust\.webmanifest$/);
        });

        it("should point the page links at every theme's own light icon", () => {
            const store = useSettingsStore();

            for (const style of STYLE_IDS) {
                store.setStyle(style);
                for (const theme of THEME_IDS_BY_STYLE[style]) {
                    store.setColorTheme(theme);
                    const key = pwaIconKey(style, theme);
                    expect(linkHref("manifest"), `${style}/${theme}`).toMatch(new RegExp(`/manifest-${key}\\.webmanifest$`));
                    expect(linkHref("apple-touch-icon"), `${style}/${theme}`).toMatch(new RegExp(`/apple-touch-icon-${key}\\.png$`));
                }
            }
        });
    });
});
