import { loadSettings, saveSettings, type ColorThemeId } from "@/application/SettingsStorage";

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
            });
        });

        it("should restore saved settings", () => {
            saveSettings({
                colorTheme: "blue",
                highlightSameDigit: false,
                completionFlash: false,
                autoRemoveNotes: false,
                showRemainingCount: false,
            });

            const settings = loadSettings();

            expect(settings.colorTheme).toBe("blue");
            expect(settings.highlightSameDigit).toBe(false);
            expect(settings.completionFlash).toBe(false);
            expect(settings.autoRemoveNotes).toBe(false);
            expect(settings.showRemainingCount).toBe(false);
        });

        it("should fill missing fields with defaults for backward compatibility", () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ colorTheme: "purple" }));

            const settings = loadSettings();

            expect(settings.colorTheme).toBe("purple");
            expect(settings.highlightSameDigit).toBe(true);
            expect(settings.completionFlash).toBe(true);
            expect(settings.autoRemoveNotes).toBe(true);
            expect(settings.showRemainingCount).toBe(true);
        });
    });
});
