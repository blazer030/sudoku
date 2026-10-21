import { COLOR_THEME_IDS, type ColorThemeId } from "@/application/SettingsStorage";
import { STYLES, getPalette } from "@/theme/palettes";

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
        expect(getPalette("minimal", "blue", "light").primary).toBe("#316099");
        expect(getPalette("minimal", "blue", "light").highlight).toBe("#E4EFF9");
    });

    it("getPalette falls back to the style's first theme", () => {
        expect(getPalette("minimal", "red" as ColorThemeId, "light")).toEqual(getPalette("minimal", "green", "light"));
    });
});
