import { ICON_THEME_IDS, THEME_IDS_BY_STYLE } from "@/theme/themeIds";
import { loadSettings, saveSettings } from "@/application/settings/SettingsStorage";

describe("SettingsStorage", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("should list the six icon themes as the minimal style's themes", () => {
        expect(THEME_IDS_BY_STYLE.minimal).toEqual(ICON_THEME_IDS);
    });

    describe("loadSettings", () => {
        it("should return default settings when no saved settings exist", () => {
            const settings = loadSettings();

            expect(settings).toEqual({
                colorTheme: "green",
                highlightSameDigit: true,
                completionFlash: true,
                autoRemoveNotes: true,
                showRemainingCount: true,
                matchLauncherIconToTheme: false,
                language: "system",
                appearance: "system",
                style: "minimal",
                highlightScope: true,
                colorThemeByStyle: { minimal: "green" },
            });
        });

        it("should seed the remembered theme from colorTheme for settings saved before it existed", () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ colorTheme: "blue" }));

            expect(loadSettings().colorThemeByStyle).toEqual({ minimal: "blue" });
        });

        it("should drop unusable remembered themes", () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ colorThemeByStyle: null }));
            expect(loadSettings().colorThemeByStyle).toEqual({ minimal: "green" });

            localStorage.setItem("sudoku-settings", JSON.stringify({ colorThemeByStyle: ["blue"] }));
            expect(loadSettings().colorThemeByStyle).toEqual({ minimal: "green" });

            localStorage.setItem("sudoku-settings", JSON.stringify({
                colorTheme: "teal",
                colorThemeByStyle: { neon: "blue", minimal: "crimson" },
            }));
            expect(loadSettings().colorThemeByStyle).toEqual({ minimal: "teal" });
        });

        it("should move a theme from another style to that style's remembered theme", () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ style: "tactile", colorTheme: "teal" }));
            expect(loadSettings().colorTheme).toBe("green");

            localStorage.setItem("sudoku-settings", JSON.stringify({
                style: "tactile",
                colorTheme: "teal",
                colorThemeByStyle: { tactile: "rust" },
            }));
            const settings = loadSettings();
            expect(settings.colorTheme).toBe("rust");
            expect(settings.colorThemeByStyle.tactile).toBe("rust");
        });

        it("should drop a remembered theme that belongs to another style", () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ colorThemeByStyle: { tactile: "purple", minimal: "blue" } }));

            expect(loadSettings().colorThemeByStyle).toEqual({ minimal: "green" });
        });

        it("should not share the remembered theme map between loads", () => {
            loadSettings().colorThemeByStyle.minimal = "teal";

            expect(loadSettings().colorThemeByStyle).toEqual({ minimal: "green" });
        });

        it("should restore saved settings", () => {
            saveSettings({
                colorTheme: "blue",
                highlightSameDigit: false,
                completionFlash: false,
                autoRemoveNotes: false,
                showRemainingCount: false,
                matchLauncherIconToTheme: true,
                language: "zh-Hant",
                appearance: "dark",
                style: "minimal",
                highlightScope: false,
                colorThemeByStyle: { minimal: "blue" },
            });

            const settings = loadSettings();

            expect(settings.colorTheme).toBe("blue");
            expect(settings.highlightSameDigit).toBe(false);
            expect(settings.completionFlash).toBe(false);
            expect(settings.autoRemoveNotes).toBe(false);
            expect(settings.showRemainingCount).toBe(false);
            expect(settings.matchLauncherIconToTheme).toBe(true);
            expect(settings.language).toBe("zh-Hant");
            expect(settings.appearance).toBe("dark");
            expect(settings.style).toBe("minimal");
        });

        it("should drop the retired seenLongPressTip flag from older stored settings", () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ colorTheme: "blue", seenLongPressTip: true }));

            const settings = loadSettings();

            expect(settings).not.toHaveProperty("seenLongPressTip");
            expect(settings.colorTheme).toBe("blue");
        });

        it.each([
            ["appearance", "sepia", "system"],
            ["style", "neon", "minimal"],
            ["colorTheme", "red", "green"],
            ["language", "fr", "system"],
        ] as const)("should normalize an unknown stored %s to its default", (key, stored, expected) => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ [key]: stored }));

            expect(loadSettings()[key]).toBe(expected);
        });

        it("should fill fields added since a setting was saved with their defaults, keeping the saved ones", () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ colorTheme: "purple" }));

            const settings = loadSettings();

            expect(settings.colorTheme).toBe("purple");
            expect(settings.highlightSameDigit).toBe(true);
            expect(settings.highlightScope).toBe(true);
            expect(settings.completionFlash).toBe(true);
            expect(settings.autoRemoveNotes).toBe(true);
            expect(settings.showRemainingCount).toBe(true);
            expect(settings.matchLauncherIconToTheme).toBe(false);
            expect(settings.language).toBe("system");
            expect(settings.appearance).toBe("system");
            expect(settings.style).toBe("minimal");
        });
    });
});
