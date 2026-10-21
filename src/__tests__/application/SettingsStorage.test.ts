import { loadSettings, saveSettings } from "@/application/SettingsStorage";

describe("SettingsStorage", () => {
    beforeEach(() => {
        localStorage.clear();
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
                seenLongPressTip: false,
            });
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
                seenLongPressTip: true,
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

        it("should default appearance and style for settings saved before they existed", () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ colorTheme: "blue", language: "en" }));

            const settings = loadSettings();

            expect(settings.appearance).toBe("system");
            expect(settings.style).toBe("minimal");
            expect(settings.colorTheme).toBe("blue");
        });

        it("should default highlightScope and seenLongPressTip for settings saved before they existed", () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ colorTheme: "blue" }));

            const settings = loadSettings();

            expect(settings.highlightScope).toBe(true);
            expect(settings.seenLongPressTip).toBe(false);
        });

        it("should normalize an unknown stored appearance to system", () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ appearance: "sepia" }));

            expect(loadSettings().appearance).toBe("system");
        });

        it("should normalize an unknown stored style to minimal", () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ style: "neon" }));

            expect(loadSettings().style).toBe("minimal");
        });

        it("should normalize an unknown stored colorTheme to green", () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ colorTheme: "red" }));

            expect(loadSettings().colorTheme).toBe("green");
        });

        it("should default language to system for settings saved before it existed", () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({
                colorTheme: "blue",
                highlightSameDigit: true,
                completionFlash: true,
                autoRemoveNotes: true,
                showRemainingCount: true,
                matchLauncherIconToTheme: false,
            }));

            const settings = loadSettings();

            expect(settings.language).toBe("system");
            expect(settings.colorTheme).toBe("blue");
        });

        it("should normalize an unknown stored language to system", () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ language: "fr" }));

            expect(loadSettings().language).toBe("system");
        });

        it("should fill missing fields with defaults for backward compatibility", () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ colorTheme: "purple" }));

            const settings = loadSettings();

            expect(settings.colorTheme).toBe("purple");
            expect(settings.highlightSameDigit).toBe(true);
            expect(settings.completionFlash).toBe(true);
            expect(settings.autoRemoveNotes).toBe(true);
            expect(settings.showRemainingCount).toBe(true);
            expect(settings.matchLauncherIconToTheme).toBe(false);
        });
    });
});
