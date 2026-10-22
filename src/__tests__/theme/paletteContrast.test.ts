import { readFileSync } from "fs";
import { THEME_IDS_BY_STYLE, STYLE_IDS, type StyleId } from "@/application/SettingsStorage";
import { contrastRatio, mixColors } from "@/theme/contrast";
import { STYLES, systemBarColor, type Palette, type PaletteToken } from "@/theme/palettes";

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

// The night lamp as it shows down the middle of the screen: a radial glow centred <c>px below the
// top edge and sized to the viewport, under a fade of the page colour that starts solid at the top
// edge and is gone by <f>px. Both are piecewise linear between their colour stops:
// --paper-lamp-fade: linear-gradient(var(--color-background), <page colour at n%> <p>px, ..., transparent <f>px)
// --paper-lamp: radial-gradient(<w>vw <h>vh at 50% <c>px, <lamp at n%> [<p>%], ..., transparent <end>%)
interface Stop { position: number; amount: number }

const PAPER_CSS = readFileSync("src/style/styles/paper.css", "utf8");

const nightDeclaration = (name: string): string => {
    const nightBlock = /:root\.dark\[data-style="paper"\]\s*\{([^}]*)\}/.exec(PAPER_CSS)?.[1] ?? "";
    const value = new RegExp(`${name}:\\s*([^;]*);`).exec(nightBlock)?.[1];
    if (value === undefined) throw new Error(`paper.css sets no ${name} at night`);
    return value.replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")").trim();
};

// "color-mix(in srgb, var(--color-<token>) 25%, transparent) 18%" or "transparent 48px"; a first
// stop with no position sits at 0
// Splits on the commas between stops, not those inside a stop's color-mix()
const splitTopLevel = (list: string): string[] => {
    const items = [""];
    let depth = 0;
    for (const character of list) {
        if (character === "(") depth++;
        if (character === ")") depth--;
        if (character === "," && depth === 0) items.push("");
        else items[items.length - 1] += character;
    }
    return items.map(item => item.trim());
};

const parseStops = (list: string, token: string): Stop[] => splitTopLevel(list)
    .map((item, index) => {
        const match = new RegExp(`^(?:color-mix\\(in srgb, var\\(--color-${token}\\) (\\d+)%, transparent\\)|var\\(--color-${token}\\)|(transparent))(?: (\\d+)(?:px|%))?$`).exec(item);
        if (match === null) throw new Error(`unexpected colour stop: ${item}`);
        // Groups that did not take part are undefined
        const [, mixed, transparent, position] = match as (string | undefined)[];
        if (position === undefined && index > 0) throw new Error(`colour stop without a position: ${item}`);
        const amount = transparent === undefined ? Number(mixed ?? 100) / 100 : 0;
        return { position: Number(position ?? 0), amount };
    });

const amountAt = (stops: Stop[], position: number): number => {
    if (position <= stops[0].position) return stops[0].amount;
    for (let index = 1; index < stops.length; index++) {
        const [before, after] = [stops[index - 1], stops[index]];
        if (position <= after.position) {
            return before.amount + (after.amount - before.amount) * (position - before.position) / (after.position - before.position);
        }
    }
    return stops[stops.length - 1].amount;
};

const parseLamp = () => {
    const fade = /^linear-gradient\((.*)\)$/.exec(nightDeclaration("--paper-lamp-fade"))?.[1];
    const glow = /^radial-gradient\(\d+vw (\d+)vh at 50% (\d+)px, (.*)\)$/.exec(nightDeclaration("--paper-lamp"));
    if (fade === undefined || glow === null) throw new Error("paper.css has no night lamp in the expected form");
    return { fade: parseStops(fade, "background"), height: Number(glow[1]), centre: Number(glow[2]), glow: parseStops(glow[3], "lamp") };
};

const LAMP = parseLamp();

/** The lamp's alpha y px below the top edge of a viewport this many px tall. */
const lampAlphaAt = (y: number, viewportHeight: number): number => {
    const rayLength = LAMP.height / 100 * viewportHeight;
    const glow = amountAt(LAMP.glow, Math.abs(y - LAMP.centre) / rayLength * 100);
    return glow * (1 - amountAt(LAMP.fade, y));
};

const VIEWPORT_HEIGHTS = [560, 640, 720, 780, 860, 960];

// The strongest alpha anywhere down the screen, on any of these phone heights
const lampPeakAlpha = (): number => Math.max(...VIEWPORT_HEIGHTS.flatMap(viewportHeight =>
    Array.from({ length: viewportHeight + 1 }, (_, y) => lampAlphaAt(y, viewportHeight))));

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

// Text levels must stay apart, so notes and secondary text never read as bright as primary text.
// Paper's night text cannot spread further: muted text must still reach 4.5 on the lamp over a dot.
const TEXT_HIERARCHY = [
    { name: "foreground over foreground-secondary", upper: "foreground", lower: "foreground-secondary", minimum: 1.3 },
    { name: "foreground over foreground-muted", upper: "foreground", lower: "foreground-muted", minimum: 1.4 },
    { name: "foreground-secondary over foreground-muted", upper: "foreground-secondary", lower: "foreground-muted", minimum: 1.05 },
] as const;

const HIERARCHY_CASES = Object.values(STYLES).flatMap(style => style.themes.flatMap(theme =>
    (["light", "dark"] as const).flatMap(mode => TEXT_HIERARCHY.map(level => ({
        label: `${style.id}/${theme.id}/${mode}: ${level.name} ≥ ${level.minimum}`,
        palette: theme[mode],
        level,
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

    it("should model the night lamp at its on-screen peak, 29%", () => {
        // The glow's centre is below the top-edge fade, so the full centre alpha shows there
        expect(LAMP_PEAK).toBeCloseTo(0.29, 3);
    });

    it("should fade the night lamp in from the page colour at the top edge, where the status bar meets it", () => {
        // Below API 35 the status bar is painted flat in the page colour right above the page,
        // and paper's dark system bar colour is that page colour
        for (const theme of STYLES.paper.themes) {
            expect(systemBarColor("paper", theme.id, "dark"), theme.id).toBe(theme.dark.background);
        }
        for (const viewportHeight of VIEWPORT_HEIGHTS) {
            expect(lampAlphaAt(0, viewportHeight), `${viewportHeight}px`).toBe(0);
            // and it rises without a step: no more than a 1.5% alpha change per px
            for (let y = 1; y <= viewportHeight; y++) {
                expect(Math.abs(lampAlphaAt(y, viewportHeight) - lampAlphaAt(y - 1, viewportHeight)), `${viewportHeight}px at ${y}px`).toBeLessThan(0.015);
            }
        }
    });

    it.each(HIERARCHY_CASES)("$label", ({ palette, level }) => {
        expect(contrastRatio(palette[level.upper], palette[level.lower])).toBeGreaterThanOrEqual(level.minimum);
    });

    it.each(CASES)("$label", ({ palette, contrastPair }) => {
        const ratio = contrastRatio(contrastPair.foreground(palette), contrastPair.background(palette));

        expect(ratio).toBeGreaterThanOrEqual(contrastPair.minimum);
    });
});
