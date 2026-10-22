import { readFileSync } from "fs";
import { THEME_IDS_BY_STYLE, STYLE_IDS, type StyleId } from "@/application/SettingsStorage";
import { contrastRatio, mixColors } from "@/theme/contrast";
import { STYLES, type Palette, type PaletteToken } from "@/theme/palettes";

const TEXT = 4.5;
const LARGE_OR_ICON = 3;

interface ContrastPair {
    name: string;
    foreground: (palette: Palette) => string;
    background: (palette: Palette) => string;
    minimum: number;
    /** Checked only in these styles; every style when left out. */
    styles?: readonly StyleId[];
}

const pair = (foreground: PaletteToken, background: PaletteToken, minimum = TEXT): ContrastPair => ({
    name: `${foreground} on ${background}`,
    foreground: palette => palette[foreground],
    background: palette => palette[background],
    minimum,
});

const tinted = (foreground: PaletteToken, tint: PaletteToken, alpha: number, base: PaletteToken, minimum: number): ContrastPair => ({
    name: `${foreground} on ${tint} ${alpha * 100}% over ${base}`,
    foreground: palette => palette[foreground],
    background: palette => mixColors(palette[tint], alpha, palette[base]),
    minimum,
});

const TEXT_PAIRS: readonly ContrastPair[] = [
    pair("foreground", "background"),
    pair("foreground", "card"),
    pair("foreground", "cell-clue"),
    pair("foreground-secondary", "background"),
    pair("foreground-secondary", "card"),
    pair("foreground-muted", "background"),
    pair("foreground-muted", "card"),
    pair("on-primary", "primary"),
    pair("on-primary", "primary-hover"),
    pair("on-danger", "danger"),
    pair("on-danger", "danger-hover"),
    pair("primary", "background"),
    pair("primary", "card"),
    pair("accent", "background"),
    pair("accent", "card"),
    pair("danger", "background"),
    pair("danger", "card"),
    pair("error", "background"),
    pair("error", "card"),
    pair("error", "error-surface"),
    // Statistics and review badges, the hint step button
    pair("primary", "primary-light"),
    pair("on-toast", "toast"),
    // The continue card
    pair("on-featured", "featured"),
];

const BOARD_SURFACES: readonly PaletteToken[] = [
    "card", "cell-clue", "primary-light", "highlight", "cell-focus", "cell-scope", "cell-pattern", "error-surface",
    "cell-selected", "cell-peer",
];
const BOARD_INKS: readonly PaletteToken[] = ["foreground", "primary", "error", "note"];
const BOARD_PAIRS: readonly ContrastPair[] = BOARD_SURFACES.flatMap(surface => BOARD_INKS.map(ink => pair(ink, surface)));

// Board layers must look different from each other, not just carry readable ink
const SURFACE_PAIRS: readonly ContrastPair[] = [
    pair("cell-clue", "card", 1.25),
    pair("highlight", "cell-clue", 1.25),
    pair("highlight", "card", 1.25),
    pair("highlight", "cell-peer", 1.25),
    pair("cell-peer", "card", 1.08),
    // The selection outline is a UI component, so 3:1 applies
    pair("primary", "cell-selected", LARGE_OR_ICON),
];

const TINTED_PAIRS: readonly ContrastPair[] = [
    tinted("accent", "accent", 0.1, "card", TEXT),
    tinted("accent", "accent", 0.15, "card", LARGE_OR_ICON),
    tinted("danger", "danger", 0.1, "card", LARGE_OR_ICON),
    // The hint panel's digit chip
    tinted("on-primary", "on-primary", 0.1, "primary", TEXT),
    // The continue card's chips
    tinted("on-featured", "on-featured", 0.2, "featured", TEXT),
    // Loader text over stacked overlays
    tinted("on-scrim", "scrim", 0.65, "background", TEXT),
];

// The night lamp's strongest alpha on screen. Its glow is centred above the top edge, so the
// brightest visible point is already part-way out along the gradient:
// radial-gradient(<w> <h> at 50% <y>, lamp <alpha>, transparent <end>)
const lampPeakAlpha = (): number => {
    const css = readFileSync("src/style/styles/paper.css", "utf8");
    const match = /radial-gradient\(\d+% (\d+)% at 50% (-?\d+)%, color-mix\(in srgb, var\(--color-lamp\) (\d+)%, transparent\), transparent (\d+)%\)/.exec(css);
    if (match === null) throw new Error("paper.css has no night lamp gradient in the expected form");
    const [height, centre, alpha, end] = match.slice(1).map(Number);
    // How far along the gradient ray the top edge sits, as a fraction of the ray
    const topEdge = Math.max(0, -centre) / height;
    return (alpha / 100) * (1 - topEdge / (end / 100));
};

const LAMP_PEAK = lampPeakAlpha();
// The texture dots are the border colour at no more than 40%; the lamp is painted over them
const GRAIN = 0.4;

// Paper's page texture: text crosses the ruled lines, the texture dots, the night lamp's glow at
// its peak, and the lamp over a dot, the brightest spot behind night text
const PAPER_INKS: readonly PaletteToken[] = ["foreground", "foreground-secondary", "foreground-muted", "primary"];
const PAPER_PAIRS: readonly ContrastPair[] = PAPER_INKS.flatMap(ink => [
    pair(ink, "rule"),
    tinted(ink, "border", GRAIN, "background", TEXT),
    {
        name: `${ink} on lamp ${(LAMP_PEAK * 100).toFixed(1)}% over background`,
        foreground: (palette: Palette) => palette[ink],
        background: (palette: Palette) => mixColors(palette.lamp, LAMP_PEAK, palette.background),
        minimum: TEXT,
    },
    {
        name: `${ink} on lamp ${(LAMP_PEAK * 100).toFixed(1)}% over a texture dot`,
        foreground: (palette: Palette) => palette[ink],
        background: (palette: Palette) => mixColors(palette.lamp, LAMP_PEAK, mixColors(palette.border, GRAIN, palette.background)),
        minimum: TEXT,
    },
]).map(contrastPair => ({ ...contrastPair, styles: ["paper"] }));

const ALL_PAIRS = [...TEXT_PAIRS, ...BOARD_PAIRS, ...SURFACE_PAIRS, ...TINTED_PAIRS, ...PAPER_PAIRS];

const CASES = Object.values(STYLES).flatMap(style => style.themes.flatMap(theme =>
    (["light", "dark"] as const).flatMap(mode =>
        ALL_PAIRS.filter(contrastPair => contrastPair.styles?.includes(style.id) ?? true).map(contrastPair => ({
            prefix: `${style.id}/${theme.id}/${mode}`,
            label: `${style.id}/${theme.id}/${mode}: ${contrastPair.name} ≥ ${contrastPair.minimum}`,
            palette: theme[mode],
            contrastPair,
        })))));

describe("palette contrast", () => {
    it("should check every style, theme and mode", () => {
        const expected = STYLE_IDS.flatMap(style => THEME_IDS_BY_STYLE[style].flatMap(theme =>
            ["light", "dark"].map(mode => `${style}/${theme}/${mode}`)));

        expect(new Set(CASES.map(contrastCase => contrastCase.prefix))).toEqual(new Set(expected));
    });

    it("should check 26 style, theme and mode combinations", () => {
        expect(new Set(CASES.map(contrastCase => contrastCase.prefix)).size).toBe(2 * (6 + 4 + 3));
    });

    it("should model the night lamp at its on-screen peak, about 29%", () => {
        // 35% at the glow's centre, 6% above the top edge, fading out by 65% of a 55%-tall ray
        expect(LAMP_PEAK).toBeCloseTo(0.291, 3);
    });

    it.each(CASES)("$label", ({ palette, contrastPair }) => {
        const ratio = contrastRatio(contrastPair.foreground(palette), contrastPair.background(palette));

        expect(ratio).toBeGreaterThanOrEqual(contrastPair.minimum);
    });
});
