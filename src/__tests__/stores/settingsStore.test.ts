import { createPinia, setActivePinia } from "pinia";
import { useSettingsStore } from "@/stores/settingsStore";
import { updateManifestLink, updateAppleTouchIcon } from "@/application/PwaThemeUpdater";
import { STYLE_IDS, THEME_IDS_BY_STYLE } from "@/application/SettingsStorage";
import { launcherIconKey } from "@/theme/launcherIcon";

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

    it("should have default values on first load", () => {
        const store = useSettingsStore();

        expect(store.colorTheme).toBe("green");
        expect(store.highlightSameDigit).toBe(true);
        expect(store.completionFlash).toBe(true);
        expect(store.autoRemoveNotes).toBe(true);
        expect(store.showRemainingCount).toBe(true);
        expect(store.matchLauncherIconToTheme).toBe(false);
        expect(store.language).toBe("system");
        expect(store.appearance).toBe("system");
        expect(store.style).toBe("minimal");
    });

    it("should persist appearance change and restore it in a new store", () => {
        const store = useSettingsStore();

        store.setAppearance("dark");

        const stored = JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
        expect(stored.appearance).toBe("dark");
        setActivePinia(createPinia());
        expect(useSettingsStore().appearance).toBe("dark");
    });

    it("should persist highlightScope and restore it in a new store", () => {
        const store = useSettingsStore();

        store.setHighlightScope(false);

        const stored = JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
        expect(stored.highlightScope).toBe(false);
        setActivePinia(createPinia());
        expect(useSettingsStore().highlightScope).toBe(false);
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

    it("should persist the chosen style", () => {
        const store = useSettingsStore();

        store.setStyle("minimal");

        const stored = JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
        expect(stored.style).toBe("minimal");
    });

    it("should not write the retired long-press tip flag when saving", () => {
        localStorage.setItem("sudoku-settings", JSON.stringify({ seenLongPressTip: true, colorTheme: "blue" }));
        const store = useSettingsStore();

        store.setStyle("minimal");

        const stored = JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
        expect(stored).not.toHaveProperty("seenLongPressTip");
        expect(stored.colorTheme).toBe("blue");
    });

    it("should persist language change and restore it in a new store", () => {
        const store = useSettingsStore();

        store.setLanguage("zh-Hant");

        const stored = JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
        expect(stored.language).toBe("zh-Hant");
        setActivePinia(createPinia());
        expect(useSettingsStore().language).toBe("zh-Hant");
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
        store.setCompletionFlash(false);
        store.setAutoRemoveNotes(false);
        store.setShowRemainingCount(false);

        expect(store.highlightSameDigit).toBe(false);
        expect(store.completionFlash).toBe(false);
        expect(store.autoRemoveNotes).toBe(false);
        expect(store.showRemainingCount).toBe(false);

        const stored = JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
        expect(stored.highlightSameDigit).toBe(false);
        expect(stored.completionFlash).toBe(false);
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
                    const key = launcherIconKey(style, theme, "light");
                    expect(linkHref("manifest"), `${style}/${theme}`).toMatch(new RegExp(`/manifest-${key}\\.webmanifest$`));
                    expect(linkHref("apple-touch-icon"), `${style}/${theme}`).toMatch(new RegExp(`/apple-touch-icon-${key}\\.png$`));
                }
            }
        });
    });
});
