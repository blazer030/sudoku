import { STYLE_IDS, THEME_IDS_BY_STYLE, STYLE_COLOR_MODES, type ColorThemeId } from "@/theme/themeIds";
import { STYLES, getPalette, rememberedThemeFor, systemBarColor } from "@/theme/palettes";
import { darkOnlyThemeBuilder } from "@/theme/paletteBuilder";
import { contrastRatio } from "@/theme/contrast";

describe("palettes", () => {
    it("should define each style's themes in the listed order", () => {
        expect(Object.keys(STYLES)).toEqual([...STYLE_IDS]);
        for (const style of STYLE_IDS) {
            expect(STYLES[style].themes.map(theme => theme.id), style).toEqual([...THEME_IDS_BY_STYLE[style]]);
        }
    });

    it("should give each theme a palette for exactly the modes its style has", () => {
        for (const style of STYLE_IDS) {
            for (const theme of STYLES[style].themes) {
                const modes = (["light", "dark"] as const).filter(mode => theme[mode] !== undefined);
                expect(modes, `${style}/${theme.id}`).toEqual([...STYLE_COLOR_MODES[style]]);
            }
        }
    });

    it("should alias primary-ink, signal and signal-surface to the primary, highlight and primary-light", () => {
        for (const style of STYLE_IDS) {
            for (const theme of STYLES[style].themes) {
                for (const palette of [theme.light, theme.dark]) {
                    if (palette === undefined) continue;
                    expect(palette["primary-ink"], `${style}/${theme.id}`).toBe(palette.primary);
                    expect(palette.signal, `${style}/${theme.id}`).toBe(palette.highlight);
                    expect(palette["signal-surface"], `${style}/${theme.id}`).toBe(palette["primary-light"]);
                }
            }
        }
    });

    it("should let a style set a board tint directly instead of deriving it from the primary", () => {
        const build = darkOnlyThemeBuilder({ ...getPalette("minimal", "green", "dark") }, { "cell-peer": "#123456", signal: "#FFE600" });
        const theme = build("green", { primary: "#00F0FF", "primary-hover": "#40F4FF", accent: "#FF2BD6" });

        expect(theme.dark?.["cell-peer"]).toBe("#123456");
        expect(theme.dark?.signal).toBe("#FFE600");
    });

    it("should build a dark-only theme with a dark palette and no light one", () => {
        const neutrals = { ...getPalette("minimal", "green", "dark") };
        const build = darkOnlyThemeBuilder(neutrals);
        const theme = build("green", { primary: "#00F0FF", "primary-hover": "#40F4FF", accent: "#FF2BD6" });

        expect(theme.light).toBeUndefined();
        expect(theme.dark?.primary).toBe("#00F0FF");
    });

    it("should use upper-case six-digit hex values everywhere", () => {
        for (const style of Object.values(STYLES)) {
            for (const theme of style.themes) {
                for (const value of [...Object.values(theme.light ?? {}), ...Object.values(theme.dark ?? {})]) {
                    expect(value).toMatch(/^#[0-9A-F]{6}$/);
                }
            }
        }
    });

    it("should merge each theme's overrides over the shared base", () => {
        expect(getPalette("minimal", "blue", "light").primary).toBe("#2C5689");
        expect(getPalette("minimal", "blue", "light").highlight).toBe("#ABCEF1");
    });

    it("should give pixel one fixed theme", () => {
        expect(STYLES.pixel.themes.map(theme => theme.id)).toEqual(["classic"]);
    });

    it("should give pixel the four handheld greens in light and the console colours in dark", () => {
        const handheld = getPalette("pixel", "classic", "light");
        const homeConsole = getPalette("pixel", "classic", "dark");

        expect(handheld.background).toBe("#9BBC0F");
        expect(handheld["on-primary"]).toBe("#9BBC0F");
        for (const token of ["foreground", "foreground-secondary", "foreground-muted", "note", "error", "danger", "primary"] as const) {
            expect(handheld[token], token).toBe("#0F380F");
        }
        expect(homeConsole.background).toBe("#000000");
        expect(homeConsole.highlight).toBe("#0058F8");
    });

    it("should give the console's light primary surface the navy card, not a tint of the gold", () => {
        expect(getPalette("pixel", "classic", "dark")["primary-light"]).toBe("#1E1E3C");
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
                for (const mode of STYLE_COLOR_MODES[style.id]) {
                    const palette = getPalette(style.id, theme.id, mode);
                    expect(palette.note, `${style.id}/${theme.id}/${mode}`).toBe(palette["foreground-secondary"]);
                }
            }
        }
    });

    // Paper's continue card is a sticky note; pixel's is the page colour framed in ink, as on the canvas
    it("should keep featured equal to primary outside paper and pixel", () => {
        for (const style of [STYLES.minimal, STYLES.tactile]) {
            for (const theme of style.themes) {
                for (const mode of STYLE_COLOR_MODES[style.id]) {
                    const palette = getPalette(style.id, theme.id, mode);
                    expect(palette.featured, `${style.id}/${theme.id}/${mode}`).toBe(palette.primary);
                    expect(palette["on-featured"], `${style.id}/${theme.id}/${mode}`).toBe(palette["on-primary"]);
                }
            }
        }
    });

    it("should keep paper's lines invisible in other styles", () => {
        for (const style of [STYLES.minimal, STYLES.tactile, STYLES.pixel]) {
            for (const theme of style.themes) {
                for (const mode of STYLE_COLOR_MODES[style.id]) {
                    const palette = getPalette(style.id, theme.id, mode);
                    for (const token of ["rule", "margin-line"] as const) {
                        expect(palette[token], `${style.id}/${theme.id}/${mode} ${token}`).toBe(palette.background);
                    }
                }
            }
        }
    });

    it("should give paper no dark palette", () => {
        for (const theme of STYLES.paper.themes) {
            expect(theme.dark, theme.id).toBeUndefined();
        }
    });

    it("should keep the dark toast a dark surface rather than a light block", () => {
        for (const style of Object.values(STYLES)) {
            for (const theme of style.themes) {
                if (theme.dark === undefined) continue;
                const { toast, background, foreground } = theme.dark;
                expect(contrastRatio(toast, background), `${style.id}/${theme.id}`).toBeLessThan(contrastRatio(toast, foreground));
            }
        }
    });
});
