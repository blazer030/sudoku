import { STYLE_IDS, THEME_IDS_BY_STYLE, STYLE_COLOR_MODES, type ColorThemeId, type StyleId } from "@/theme/themeIds";
import { STYLES, STYLE_OWN_TOKENS, getPalette, rememberedThemeFor, swatchColors, systemBarColor, type StyleOwnToken } from "@/theme/palettes";
import { darkOnlyThemeBuilder } from "@/theme/paletteBuilder";
import { contrastRatio, mixColors } from "@/theme/contrast";

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
                expect(new Set(modes), `${style}/${theme.id}`).toEqual(new Set(STYLE_COLOR_MODES[style]));
            }
        }
    });

    // Cyber sets its own neon ink, signal and signal surface
    it("should alias primary-ink, signal and signal-surface to the primary, highlight and primary-light outside cyber", () => {
        for (const style of STYLE_IDS.filter(id => id !== "cyber")) {
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

    it("should give cyber its own neon ink, signal and signal surface", () => {
        const palette = getPalette("cyber", "neon", "dark");

        expect(palette["primary-ink"]).toBe("#FF5AE0");
        expect(palette.signal).toBe("#FCEE0A");
        expect(palette["signal-surface"]).toBe("#3A3506");
    });

    it("should give cyber one dark-only theme on a near-black page", () => {
        expect(STYLES.cyber.themes.map(theme => theme.id)).toEqual(["neon"]);
        expect(STYLES.cyber.themes[0].light).toBeUndefined();
        expect(getPalette("cyber", "neon", "light")).toEqual(getPalette("cyber", "neon", "dark"));
        expect(getPalette("cyber", "neon", "dark").background).toBe("#07070D");
    });

    it("should give ink one light-only vermilion theme on washi, with a seal primary and blue-black player ink", () => {
        const palette = getPalette("ink", "vermilion", "light");

        expect(STYLES.ink.themes.map(theme => theme.id)).toEqual(["vermilion"]);
        expect(getPalette("ink", "vermilion", "dark")).toEqual(palette);
        expect(palette.background).toBe("#F2ECDF");
        expect(palette.primary).toBe("#B3261E");
        expect(palette.accent).toBe("#2C3E5C");
    });

    it("should give chalkboard one classic theme: yellow chalk on the green board, orange marker on the whiteboard", () => {
        const chalkboard = getPalette("chalkboard", "classic", "dark");
        const whiteboard = getPalette("chalkboard", "classic", "light");

        expect(STYLES.chalkboard.themes.map(theme => theme.id)).toEqual(["classic"]);
        expect(chalkboard.background).toBe("#2E4B3C");
        expect(chalkboard.primary).toBe("#F7C873");
        expect(chalkboard.accent).toBe("#A6D8F2");
        expect(whiteboard.background).toBe("#F5F6F3");
        expect(whiteboard.primary).toBe("#B04A00");
        expect(whiteboard.accent).toBe("#1D5FC2");
    });

    it("should lay chalkboard's hint scope cells in the peer wash and its pattern cells in the same-digit wash, as the canvas does", () => {
        for (const mode of STYLE_COLOR_MODES.chalkboard) {
            const palette = getPalette("chalkboard", "classic", mode);

            expect(palette["cell-scope"], mode).toBe(palette["cell-peer"]);
            expect(palette["cell-pattern"], mode).toBe(palette.highlight);
        }
    });

    it("should colour chalkboard's tray and duster as the canvas paints them: wood on 黑板, grey plastic on 白板", () => {
        for (const [mode, tray, trayShade, trayEdge] of [["dark", "#8A5A34", "#5E3B20", "#A06C42"], ["light", "#D7DADF", "#B5BAC2", "#E6E8EB"]] as const) {
            const palette = getPalette("chalkboard", "classic", mode);

            expect([palette.tray, palette["tray-shade"], palette["tray-edge"]], mode).toEqual([tray, trayShade, trayEdge]);
            expect([palette.duster, palette["duster-felt"]], mode).toEqual(["#5B5F66", "#C9B79C"]);
        }
    });

    // Each style that paints colours of its own carries exactly those, in every theme and mode it has
    const OWN_TOKENS_BY_STYLE: Partial<Record<StyleId, readonly StyleOwnToken[]>> = {
        chalkboard: ["tray", "tray-shade", "tray-edge", "duster", "duster-felt", "smudge", "smear", "icon-frame", "doodle"],
        blueprint: ["grid-minor", "grid-major", "hatch", "error-hatch"],
    };

    it("should give chalkboard and blueprint only their own colours, and no other style any", () => {
        expect(new Set(Object.values(OWN_TOKENS_BY_STYLE).flat())).toEqual(new Set(STYLE_OWN_TOKENS));
        for (const style of STYLE_IDS) {
            const ownTokens = OWN_TOKENS_BY_STYLE[style] ?? [];
            for (const theme of STYLES[style].themes) {
                for (const mode of STYLE_COLOR_MODES[style]) {
                    const palette = getPalette(style, theme.id, mode);
                    const label = `${style}/${theme.id}/${mode}`;
                    expect(STYLE_OWN_TOKENS.filter(token => token in palette), label).toEqual(ownTokens);
                    for (const token of ownTokens) {
                        expect(palette[token], `${label} ${token}`).toMatch(/^#[0-9A-F]{6}$/);
                    }
                }
            }
        }
    });

    it("should give blueprint its four papers in the picker's order", () => {
        expect(STYLES.blueprint.themes.map(theme => theme.id)).toEqual(["blue", "teal", "slate", "rust"]);
    });

    it("should change the paper in 藍曬圖: teal under white lines, an amber accent and a lighter error", () => {
        const palette = getPalette("blueprint", "teal", "dark");

        expect(palette.background).toBe("#0E4D5C");
        expect(palette["on-primary"]).toBe("#0A3540");
        expect(palette.primary).toBe("#FFD166");
        expect(palette.error).toBe("#FFA39B");
        expect(palette.foreground).toBe("#F2F7FF");
        expect(palette.accent).toBe(palette.foreground);
    });

    it("should change the ink on 製圖紙: rust ink under a red pen that marks both choices and errors", () => {
        const palette = getPalette("blueprint", "rust", "light");

        expect(palette.foreground).toBe("#6B3A1E");
        expect(palette["foreground-secondary"]).toBe("#7A5A44");
        expect(palette.background).toBe("#FAFBFC");
        expect(palette.primary).toBe("#C0392B");
        expect(palette.error).toBe("#C0392B");
    });

    it("should give 藍曬圖's toast the lines' ink with the paper's colour on it", () => {
        for (const theme of STYLES.blueprint.themes) {
            const palette = getPalette("blueprint", theme.id, "dark");
            expect([palette.toast, palette["on-toast"]], theme.id).toEqual([palette.foreground, palette.background]);
        }
    });

    it("should hatch 藍曬圖 in its own white ink and 製圖紙 in one printed blue for every ink", () => {
        for (const theme of STYLES.blueprint.themes) {
            const dark = getPalette("blueprint", theme.id, "dark");
            expect(dark.hatch, theme.id).toBe(mixColors("#F2F7FF", 0.12, dark.background));
        }
        const lightHatches = STYLES.blueprint.themes.map(theme => getPalette("blueprint", theme.id, "light").hatch);
        expect(new Set(lightHatches).size).toBe(1);
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
        for (const style of [STYLES.minimal, STYLES.tactile, STYLES.pixel, STYLES.cyber, STYLES.ink, STYLES.chalkboard, STYLES.blueprint]) {
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

    // 藍曬圖's toast is the canvas's: a block of the white lines' ink with the paper's colour on it
    it("should keep the dark toast a dark surface rather than a light block outside blueprint", () => {
        for (const style of Object.values(STYLES).filter(definition => definition.id !== "blueprint")) {
            for (const theme of style.themes) {
                if (theme.dark === undefined) continue;
                const { toast, background, foreground } = theme.dark;
                expect(contrastRatio(toast, background), `${style.id}/${theme.id}`).toBeLessThan(contrastRatio(toast, foreground));
            }
        }
    });

    describe("swatchColors", () => {
        it("should show a style's primary with the colour on it by default", () => {
            const palette = getPalette("minimal", "blue", "light");

            expect(swatchColors("minimal", "light", palette)).toEqual({ fill: palette.primary, mark: palette["on-primary"] });
        });
    });
});
