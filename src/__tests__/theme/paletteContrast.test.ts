import { contrastRatio, mixColors } from "@/theme/contrast";
import { STYLES, type Palette, type PaletteToken } from "@/theme/palettes";

const TEXT = 4.5;
const LARGE_OR_ICON = 3;

interface ContrastPair {
    name: string;
    foreground: (palette: Palette) => string;
    background: (palette: Palette) => string;
    minimum: number;
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
    // The continue button's time label and the hint panel's digit chip
    tinted("on-primary", "on-primary", 0.1, "primary", TEXT),
    // Loader text over stacked overlays
    tinted("on-scrim", "scrim", 0.65, "background", TEXT),
];

const CASES = Object.values(STYLES).flatMap(style => style.themes.flatMap(theme =>
    (["light", "dark"] as const).flatMap(mode =>
        [...TEXT_PAIRS, ...BOARD_PAIRS, ...SURFACE_PAIRS, ...TINTED_PAIRS].map(contrastPair => ({
            label: `${style.id}/${theme.id}/${mode}: ${contrastPair.name} ≥ ${contrastPair.minimum}`,
            palette: theme[mode],
            contrastPair,
        })))));

describe("palette contrast", () => {
    it.each(CASES)("$label", ({ palette, contrastPair }) => {
        const ratio = contrastRatio(contrastPair.foreground(palette), contrastPair.background(palette));

        expect(ratio).toBeGreaterThanOrEqual(contrastPair.minimum);
    });
});
