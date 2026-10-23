import { STYLE_IDS, THEME_IDS_BY_STYLE, type ColorThemeId } from "@/theme/themeIds";
import { STYLES, getPalette, rememberedThemeFor, systemBarColor } from "@/theme/palettes";
import { contrastRatio } from "@/theme/contrast";

describe("palettes", () => {
    it("should define each style's themes in the listed order", () => {
        expect(Object.keys(STYLES)).toEqual([...STYLE_IDS]);
        for (const style of STYLE_IDS) {
            expect(STYLES[style].themes.map(theme => theme.id), style).toEqual([...THEME_IDS_BY_STYLE[style]]);
        }
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

    it("getPalette gives a light-only style its light palette whatever the mode", () => {
        expect(getPalette("paper", "blueInk", "dark")).toEqual(getPalette("paper", "blueInk", "light"));
    });

    it("systemBarColor gives a light-only style its light bar colour whatever the mode", () => {
        expect(systemBarColor("paper", "blueInk", "dark")).toBe(systemBarColor("paper", "blueInk", "light"));
    });

    it("getPalette falls back to the style's first theme", () => {
        expect(getPalette("minimal", "red" as ColorThemeId, "light")).toEqual(getPalette("minimal", "green", "light"));
    });

    it("rememberedThemeFor returns the theme remembered for the style", () => {
        expect(rememberedThemeFor("minimal", { minimal: "teal" })).toBe("teal");
    });

    it("rememberedThemeFor falls back to the style's first theme", () => {
        expect(rememberedThemeFor("minimal", {})).toBe("green");
        expect(rememberedThemeFor("minimal", { minimal: "crimson" as ColorThemeId })).toBe("green");
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

    it("should keep featured equal to primary outside paper", () => {
        for (const style of [STYLES.minimal, STYLES.tactile]) {
            for (const theme of style.themes) {
                for (const mode of ["light", "dark"] as const) {
                    expect(theme[mode].featured, `${style.id}/${theme.id}/${mode}`).toBe(theme[mode].primary);
                    expect(theme[mode]["on-featured"], `${style.id}/${theme.id}/${mode}`).toBe(theme[mode]["on-primary"]);
                }
            }
        }
    });

    it("should keep paper's lines and lamp invisible in other styles", () => {
        for (const style of [STYLES.minimal, STYLES.tactile]) {
            for (const theme of style.themes) {
                for (const mode of ["light", "dark"] as const) {
                    const palette = theme[mode];
                    for (const token of ["rule", "margin-line", "lamp"] as const) {
                        expect(palette[token], `${style.id}/${theme.id}/${mode} ${token}`).toBe(palette.background);
                    }
                }
            }
        }
    });

    it("should light the paper lamp only at night", () => {
        for (const theme of STYLES.paper.themes) {
            expect(theme.light.lamp, theme.id).toBe(theme.light.background);
            expect(theme.dark.lamp, theme.id).not.toBe(theme.dark.background);
        }
    });

    it("should keep the dark toast a dark surface rather than a light block", () => {
        for (const style of Object.values(STYLES)) {
            for (const theme of style.themes) {
                const { toast, background, foreground } = theme.dark;
                expect(contrastRatio(toast, background), `${style.id}/${theme.id}`).toBeLessThan(contrastRatio(toast, foreground));
            }
        }
    });
});
