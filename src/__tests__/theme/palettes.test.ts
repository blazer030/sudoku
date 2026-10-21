import { COLOR_THEME_IDS, type ColorThemeId } from "@/application/SettingsStorage";
import { STYLES, getPalette } from "@/theme/palettes";
import { contrastRatio } from "@/theme/contrast";

describe("palettes", () => {
    it("should define every color theme for the minimal style in order", () => {
        expect(STYLES.minimal.themes.map(theme => theme.id)).toEqual([...COLOR_THEME_IDS]);
    });

    it("should use upper-case six-digit hex values everywhere", () => {
        for (const style of Object.values(STYLES)) {
            for (const theme of style.themes) {
                for (const value of [...Object.values(theme.light), ...Object.values(theme.dark)]) {
                    expect(value).toMatch(/^#[0-9A-F]{6}$/);
                }
            }
        }
    });

    it("should merge each theme's overrides over the shared base", () => {
        expect(getPalette("minimal", "blue", "light").primary).toBe("#2C5689");
        expect(getPalette("minimal", "blue", "light").highlight).toBe("#ABCEF1");
    });

    it("getPalette falls back to the style's first theme", () => {
        expect(getPalette("minimal", "red" as ColorThemeId, "light")).toEqual(getPalette("minimal", "green", "light"));
    });

    it("uses the secondary text colour for notes in every palette", () => {
        for (const style of Object.values(STYLES)) {
            for (const theme of style.themes) {
                for (const mode of ["light", "dark"] as const) {
                    expect(theme[mode].note, `${style.id}/${theme.id}/${mode}`).toBe(theme[mode]["foreground-secondary"]);
                }
            }
        }
    });

    it("should keep the dark toast a dark surface rather than a light block", () => {
        for (const theme of STYLES.minimal.themes) {
            const { toast, background, foreground } = theme.dark;
            expect(contrastRatio(toast, background)).toBeLessThan(contrastRatio(toast, foreground));
        }
    });
});
