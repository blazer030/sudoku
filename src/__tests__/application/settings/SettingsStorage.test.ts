import { ICON_THEME_IDS, THEME_IDS_BY_STYLE } from "@/theme/themeIds";
import { loadSettings, saveSettings } from "@/application/settings/SettingsStorage";

describe("SettingsStorage", () => {
    const stubSystemDark = (dark: boolean) => {
        vi.stubGlobal("matchMedia", (query: string) => ({ matches: dark && query === "(prefers-color-scheme: dark)" }));
    };

    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
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
                appearance: "light",
                style: "minimal",
                highlightScope: true,
                colorThemeByStyle: { minimal: "green" },
            });
        });

        it("should treat saved settings that are the JSON text null as no saved settings", () => {
            localStorage.setItem("sudoku-settings", "null");

            expect(loadSettings().style).toBe("minimal");
        });

        it("should treat saved settings that are not valid JSON as no saved settings", () => {
            localStorage.setItem("sudoku-settings", "{not json");

            expect(loadSettings().style).toBe("minimal");
        });

        it.each(["42", "[\"paper\"]", "\"paper\""])("should treat saved settings that are not an object (%s) as no saved settings", (stored) => {
            localStorage.setItem("sudoku-settings", stored);

            const settings = loadSettings();

            expect(settings).toEqual(expect.objectContaining({ style: "minimal", colorTheme: "green" }));
            expect(settings).not.toHaveProperty("0");
        });

        it("should replace unreadable saved settings with readable ones", () => {
            localStorage.setItem("sudoku-settings", "{not json");

            loadSettings();

            expect(() => JSON.parse(localStorage.getItem("sudoku-settings") ?? "") as unknown).not.toThrow();
        });

        it("should still return the settings when saving the migrated appearance fails", () => {
            stubSystemDark(true);
            vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
                throw new DOMException("quota", "QuotaExceededError");
            });

            expect(loadSettings().appearance).toBe("dark");
        });

        it("should start a fresh install in the mode the system shows", () => {
            stubSystemDark(true);

            expect(loadSettings().appearance).toBe("dark");
        });

        it.each(["system", "sepia"])("should turn a stored %s appearance into the system's mode and save it", (stored) => {
            stubSystemDark(false);
            localStorage.setItem("sudoku-settings", JSON.stringify({ appearance: stored }));

            expect(loadSettings().appearance).toBe("light");
            expect(JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}")).toMatchObject({ appearance: "light" });

            stubSystemDark(true);
            expect(loadSettings().appearance).toBe("light");
        });

        it("should keep a stored dark appearance whatever the system shows", () => {
            stubSystemDark(false);
            localStorage.setItem("sudoku-settings", JSON.stringify({ appearance: "dark" }));

            expect(loadSettings().appearance).toBe("dark");
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
            expect(settings.appearance).toBe("light");
            expect(settings.style).toBe("minimal");
        });
    });
});
