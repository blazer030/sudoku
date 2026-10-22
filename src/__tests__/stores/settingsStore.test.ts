import { createPinia, setActivePinia } from "pinia";
import { useSettingsStore } from "@/stores/settingsStore";
import { updateFavicon, updateManifestLink, updateAppleTouchIcon } from "@/application/PwaThemeUpdater";
import type { IconService } from "@/application/icon/IconService";
import { ICON_THEME_IDS, STYLE_IDS, THEME_IDS_BY_STYLE } from "@/application/SettingsStorage";

// Spies that still update the page links, so tests can read the hrefs too
vi.mock("@/application/PwaThemeUpdater", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/application/PwaThemeUpdater")>();
    return {
        updateMetaThemeColor: vi.fn(),
        updateFavicon: vi.fn(actual.updateFavicon),
        updateManifestLink: vi.fn(actual.updateManifestLink),
        updateAppleTouchIcon: vi.fn(actual.updateAppleTouchIcon),
    };
});

const ICON_LINK_RELS = ["icon", "manifest", "apple-touch-icon"] as const;

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

    it("should remember that the long-press tip was seen", () => {
        const store = useSettingsStore();

        store.markLongPressTipSeen();

        expect(store.seenLongPressTip).toBe(true);
        const stored = JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
        expect(stored.seenLongPressTip).toBe(true);
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

        expect(updateFavicon).toHaveBeenCalledWith("blue");
        expect(updateManifestLink).toHaveBeenCalledWith("blue");
        expect(updateAppleTouchIcon).toHaveBeenCalledWith("blue");
    });

    describe("icon sync", () => {
        const buildIconService = (): { service: IconService; setIcon: ReturnType<typeof vi.fn> } => {
            const setIcon = vi.fn().mockResolvedValue(undefined);
            return { service: { setIcon }, setIcon };
        };

        it("calls IconService.setIcon when theme changes and toggle is ON", async () => {
            const { service, setIcon } = buildIconService();
            const store = useSettingsStore();
            store.setIconService(service);
            store.setMatchLauncherIconToTheme(true);
            setIcon.mockClear();

            store.setColorTheme("blue");
            await Promise.resolve();

            expect(setIcon).toHaveBeenCalledWith("blue");
        });

        it("does NOT call IconService.setIcon when theme changes and toggle is OFF", async () => {
            const { service, setIcon } = buildIconService();
            const store = useSettingsStore();
            store.setIconService(service);

            store.setColorTheme("blue");
            await Promise.resolve();

            expect(setIcon).not.toHaveBeenCalled();
        });

        it("calls IconService.setIcon when toggle transitions OFF → ON (sync to current theme)", async () => {
            const { service, setIcon } = buildIconService();
            const store = useSettingsStore();
            store.setIconService(service);
            store.setColorTheme("purple");
            setIcon.mockClear();

            store.setMatchLauncherIconToTheme(true);
            await Promise.resolve();

            expect(setIcon).toHaveBeenCalledWith("purple");
        });

        it("does not call IconService.setIcon when toggle transitions ON → OFF", async () => {
            const { service, setIcon } = buildIconService();
            const store = useSettingsStore();
            store.setIconService(service);
            store.setMatchLauncherIconToTheme(true);
            setIcon.mockClear();

            store.setMatchLauncherIconToTheme(false);
            await Promise.resolve();

            expect(setIcon).not.toHaveBeenCalled();
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
            const ICON_FILE_PATTERN = new RegExp(`-(?:${ICON_THEME_IDS.join("|")})\\.(?:svg|webmanifest|png)$`);

            it("should never hand a non-icon id to the icon or the page links", () => {
                const { service, setIcon } = buildIconService();
                const store = useSettingsStore();
                store.setIconService(service);
                store.setMatchLauncherIconToTheme(true);

                for (const style of STYLE_IDS) {
                    store.setStyle(style);
                    for (const theme of THEME_IDS_BY_STYLE[style]) {
                        store.setColorTheme(theme);
                        for (const rel of ICON_LINK_RELS) {
                            expect(linkHref(rel), `${style}/${theme} ${rel}`).toMatch(ICON_FILE_PATTERN);
                        }
                    }
                }

                expect(setIcon.mock.calls.length).toBeGreaterThan(0);
                for (const [iconTheme] of setIcon.mock.calls) {
                    expect(ICON_THEME_IDS).toContain(iconTheme);
                }
            });
        });
    });
});
