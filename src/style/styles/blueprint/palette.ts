// Relative imports only: scripts/ import this file through src/theme/palettes.ts.
import { themeBuilder, type DarkThemeColors, type LightThemeColors, type Neutrals, type StyleDefinition, type ThemePalette } from "../../../theme/paletteBuilder";
import { mixColors } from "../../../theme/contrast";
import type { ColorThemeId } from "../../../theme/themeIds";

// Blueprint: an engineering drawing on graph paper, from the style-research canvas (Blueprint.dc.html, .m-dark and
// .m-light). 藍曬圖 (dark) is white lines on a blueprint whose paper each theme changes, with amber for everything
// chosen; 製圖紙 (light) is one white drafting paper whose ink each theme changes, with a red pen for everything
// chosen and for errors. A theme's neutrals change with it, so each theme builds its own (themeBuilder once per
// theme). The board is laid on the page's paper colour, so every board wash is mixed over the page, as the canvas
// lays them; washes, lines and hatching are eased where the fixed inks must still read (the spec's 對比度的取捨).

// The white that the canvas lays its card, grid and dialogs in
const WHITE = "#FFFFFF";

interface BlueprintPaper { paper: string; onAmber: string; paleLine: string }

const BLUEPRINT = {
    line: "#F2F7FF",
    amber: "#FFD166",
    amberHover: "#FFDB85",
    // The canvas's #FF8A80 reads under 4.5:1 on the teal and rust papers; this is the nearest that reads on all four
    error: "#FFA39B",
    errorHover: "#FFB7B0",
} as const;

// The paper, the text on the amber and the pale lines, per theme
const BLUEPRINT_PAPERS: Readonly<Record<"blue" | "teal" | "slate" | "rust", BlueprintPaper>> = {
    blue: { paper: "#123F78", onAmber: "#10325F", paleLine: "#C2D4EE" },
    teal: { paper: "#0E4D5C", onAmber: "#0A3540", paleLine: "#C2D4EE" },
    slate: { paper: "#2B3A4E", onAmber: "#1E2A38", paleLine: "#C2D4EE" },
    rust: { paper: "#5A3A22", onAmber: "#3E2716", paleLine: "#E8D6C2" },
};

interface DraftingInk { ink: string; paleInk: string }

const DRAFTING = {
    paper: "#FAFBFC",
    redPen: "#C0392B",
    redPenHover: "#A93226",
    onRedPen: "#FFFFFF",
    // The graph paper and its hatching are printed in one blue whatever the ink, as the canvas prints them
    printBlue: "#0F3A73",
    gridMinor: "#E6EDF6",
    // The canvas's #CFDCEC, eased so the pale ink still reads where it crosses a major line
    gridMajor: "#D6E1EF",
} as const;

// The ink and the pale ink, per theme
const DRAFTING_INKS: Readonly<Record<"blue" | "teal" | "slate" | "rust", DraftingInk>> = {
    blue: { ink: "#0F3A73", paleInk: "#4A6386" },
    teal: { ink: "#0B5563", paleInk: "#3E6670" },
    slate: { ink: "#2B3A4E", paleInk: "#56637A" },
    rust: { ink: "#6B3A1E", paleInk: "#7A5A44" },
};

// The washes over the page: the selected cell, the same digit, the hatching's lines, the major grid lines and the
// error cell's. 製圖紙's red pen is drawn on the selected and same-digit washes and on the hatching, so they ease to
// 8%; 藍曬圖's pale lines are drawn on the hatching and the major lines, so they ease to 12%.
const BLUEPRINT_WASH = { selected: 0.12, sameDigit: 0.16, hatch: 0.12, gridMinor: 0.065, gridMajor: 0.12, error: 0.05, errorHatch: 0.06, card: 0.04, border: 0.45 } as const;
const DRAFTING_WASH = { selected: 0.08, sameDigit: 0.08, hatch: 0.08, error: 0.05, errorHatch: 0.08, card: 0.88, border: 0.35 } as const;

// Muted text sits a step below the pale lines or ink, still readable on the page and the card
const MUTED_STRENGTH = 0.9;

const blueprintNeutrals = ({ paper, onAmber, paleLine }: BlueprintPaper): Neutrals<DarkThemeColors> => ({
    "background": paper,
    "card": mixColors(WHITE, BLUEPRINT_WASH.card, paper),
    "border": mixColors(BLUEPRINT.line, BLUEPRINT_WASH.border, paper),
    "foreground": BLUEPRINT.line,
    "foreground-secondary": paleLine,
    "foreground-muted": mixColors(paleLine, MUTED_STRENGTH, paper),
    // Clues sit on the paper, like every other cell
    "cell-clue": paper,
    "danger": BLUEPRINT.error,
    "danger-hover": BLUEPRINT.errorHover,
    "error": BLUEPRINT.error,
    "error-surface": mixColors(BLUEPRINT.error, BLUEPRINT_WASH.error, paper),
    "shadow": onAmber,
    "on-primary": onAmber,
    "on-danger": paper,
    // Dialogs open over the paper itself, faded (the skin sets how far)
    "scrim": paper,
    "on-scrim": BLUEPRINT.line,
    "toast": BLUEPRINT.line,
    "on-toast": paper,
});

const draftingNeutrals = ({ ink, paleInk }: DraftingInk): Neutrals<LightThemeColors> => ({
    "background": DRAFTING.paper,
    "card": mixColors(WHITE, DRAFTING_WASH.card, DRAFTING.paper),
    "border": mixColors(ink, DRAFTING_WASH.border, DRAFTING.paper),
    "foreground": ink,
    "foreground-secondary": paleInk,
    "foreground-muted": mixColors(paleInk, MUTED_STRENGTH, DRAFTING.paper),
    "cell-clue": DRAFTING.paper,
    "danger": DRAFTING.redPen,
    "danger-hover": DRAFTING.redPenHover,
    "error": DRAFTING.redPen,
    "error-surface": mixColors(DRAFTING.redPen, DRAFTING_WASH.error, DRAFTING.paper),
    "shadow": ink,
    "on-primary": DRAFTING.onRedPen,
    "on-danger": DRAFTING.paper,
    "scrim": DRAFTING.paper,
    "on-scrim": ink,
    "toast": ink,
    "on-toast": DRAFTING.paper,
});

// The continue card is a title block drawn on the page in the lines' ink. The selected and focus cells and the
// primary's soft surface (a hint's answer cell, badges) take the selected wash; peer and scope cells are hatched (their token is the
// hatching's line colour, the darkest a note under it meets); same-digit and pattern cells take the same-digit
// wash. The graph paper, the hatching and the error cell's hatching are blueprint's own colours.
const blueprintTheme = (id: ColorThemeId, papers: BlueprintPaper, inks: DraftingInk): ThemePalette => {
    const { paper } = papers;
    const amberWash = (strength: number) => mixColors(BLUEPRINT.amber, strength, paper);
    const redPenWash = (strength: number) => mixColors(DRAFTING.redPen, strength, DRAFTING.paper);
    const darkHatch = mixColors(BLUEPRINT.line, BLUEPRINT_WASH.hatch, paper);
    const lightHatch = mixColors(DRAFTING.printBlue, DRAFTING_WASH.hatch, DRAFTING.paper);
    return themeBuilder(
        draftingNeutrals(inks),
        blueprintNeutrals(papers),
        {
            "featured": DRAFTING.paper,
            "on-featured": inks.ink,
            "cell-selected": redPenWash(DRAFTING_WASH.selected),
            "cell-focus": redPenWash(DRAFTING_WASH.selected),
            "cell-peer": lightHatch,
            "cell-scope": lightHatch,
            "cell-pattern": redPenWash(DRAFTING_WASH.sameDigit),
            "grid-minor": DRAFTING.gridMinor,
            "grid-major": DRAFTING.gridMajor,
            "hatch": lightHatch,
            "error-hatch": redPenWash(DRAFTING_WASH.errorHatch),
        },
        {
            "featured": paper,
            "on-featured": BLUEPRINT.line,
            "primary-light": amberWash(BLUEPRINT_WASH.selected),
            "highlight": amberWash(BLUEPRINT_WASH.sameDigit),
            "cell-selected": amberWash(BLUEPRINT_WASH.selected),
            "cell-focus": amberWash(BLUEPRINT_WASH.selected),
            "cell-peer": darkHatch,
            "cell-scope": darkHatch,
            "cell-pattern": amberWash(BLUEPRINT_WASH.sameDigit),
            "grid-minor": mixColors(WHITE, BLUEPRINT_WASH.gridMinor, paper),
            "grid-major": mixColors(WHITE, BLUEPRINT_WASH.gridMajor, paper),
            "hatch": darkHatch,
            "error-hatch": mixColors(BLUEPRINT.error, BLUEPRINT_WASH.errorHatch, paper),
        },
    )(id,
        {
            "primary": DRAFTING.redPen,
            "primary-hover": DRAFTING.redPenHover,
            "primary-light": redPenWash(DRAFTING_WASH.selected),
            // The player's digits are in the clues' ink, told apart by their hand
            "accent": inks.ink,
            "highlight": redPenWash(DRAFTING_WASH.sameDigit),
        },
        { "primary": BLUEPRINT.amber, "primary-hover": BLUEPRINT.amberHover, "accent": BLUEPRINT.line });
};

export const BLUEPRINT_STYLE: StyleDefinition = {
    id: "blueprint",
    themes: (["blue", "teal", "slate", "rust"] as const).map(id => blueprintTheme(id, BLUEPRINT_PAPERS[id], DRAFTING_INKS[id])),
};
