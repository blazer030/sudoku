import { readFileSync } from "fs";
import postcss from "postcss";
import { STYLE_IDS, type StyleId } from "@/theme/themeIds";

// Press feedback every style must give the v-press states and the segmented indicator
const PRESS = ["[data-pressed]", "[data-press-motion][data-pressed]", "[data-press-bounce]", ".segmented-indicator-motion"] as const;

// Each fragment must occur in some selector of that style's sheet
const REQUIRED_SELECTORS: Record<StyleId, readonly string[]> = {
    minimal: [
        ...PRESS,
        "[data-group]",
        '[data-celebration="playing"]',
        '[data-celebration="still"]',
        '[data-skin~="trophy"]',
        '[data-skin~="celebration"]:not([data-still])',
        ".minimal-loader-square",
    ],
    tactile: [
        ...PRESS,
        '[data-skin~="key"]',
        '[data-skin~="button"]',
        '[data-skin~="tile"][aria-pressed="true"]',
        '[data-skin~="board"]',
        "[data-value-kind]",
        ".value-arrive",
        '[data-skin~="title-glyph"]',
        '[data-skin~="segmented-indicator"]',
        "[data-group]",
        '[data-celebration="playing"]',
        '[data-celebration="still"]',
        '[data-skin~="trophy"]',
        '[data-skin~="celebration"]:not([data-still])',
        ".tactile-loader-tile",
    ],
    paper: [
        ...PRESS,
        '[data-skin~="page-ruled"]',
        '[data-skin~="page"]',
        '[data-skin~="page-header"]',
        '[data-variant="selected"]::after',
        '[data-note-highlight]::after',
        '[data-skin~="board"]',
        '[data-skin~="board"] [data-variant="clue"]',
        ".value-arrive",
        ".paper-digit-stroke",
        ".value-leave::before",
        '[data-skin~="check"]',
        '[data-skin~="continue"]',
        '[data-skin~="new-game"]',
        "[data-group]",
        '[data-celebration="playing"]',
        '[data-celebration="still"]',
        '[data-skin~="complete-title"]',
        '[data-skin~="celebration"]:not([data-still])',
        ".paper-loader-line",
        ".paper-group-stroke",
        ".paper-stamp",
    ],
    pixel: [
        ...PRESS,
        "[data-group]",
        '[data-celebration="playing"]',
        '[data-skin~="trophy"]',
        '[data-skin~="celebration"]:not([data-still])',
        ".pixel-loader-square",
        ".pixel-group-spark",
        ".pixel-stage-letter",
    ],
    cyber: [
        ...PRESS,
        "[data-group]",
        '[data-celebration="playing"]',
        '[data-skin~="trophy"]',
        '[data-skin~="complete-title"]',
        '[data-skin~="celebration"]:not([data-still])',
        ".cyber-loader-square",
        ".cyber-group-frame",
        ".cyber-mission",
    ],
    ink: [
        ...PRESS,
        ".ink-loader-stroke",
        ".ink-loader-seal",
        "[data-group]",
        ".ink-group-brush",
        '[data-celebration="playing"]',
        '[data-skin~="trophy"]',
        '[data-skin~="complete-title"]',
        '[data-skin~="celebration"]:not([data-still])',
        ".ink-seal-stamp",
        '[data-skin~="hero-title"]',
        '[data-skin~="hero-seal"]',
        '[data-skin~="hero-vertical"]',
    ],
    chalkboard: [
        ...PRESS,
        '[data-skin~="board"]',
        '[data-skin~="board-grid"]::after',
        "[data-selected]::after",
        "[data-value-kind]",
        "[data-note-highlight]",
        '[data-skin~="page-ruled"]::before',
        '[data-skin~="page"]',
        '[data-skin~="page-header"]',
        '[data-skin~="logo"]::after',
        '[data-skin~="title"]::after',
        '[data-skin~="continue"]',
        '[data-skin~="new-game"]',
        '[data-skin~="key"][aria-pressed="true"]',
        '[data-skin~="tile"][aria-pressed="true"]',
        '[data-skin~="segmented-indicator"]',
        ".value-arrive",
        ".chalkboard-digit-stroke",
        ".chalkboard-digit-dust",
    ],
};

const selectorsOf = (style: StyleId): string[] => {
    const selectors: string[] = [];
    postcss.parse(readFileSync(`src/style/styles/${style}/skin.css`, "utf8")).walkRules((rule) => {
        selectors.push(...rule.selectors);
    });
    return selectors;
};

describe("style coverage", () => {
    it.each(STYLE_IDS)("%s.css styles every surface its style changes", (style) => {
        const selectors = selectorsOf(style);
        const missing = REQUIRED_SELECTORS[style].filter(fragment => !selectors.some(selector => selector.includes(fragment)));

        expect(missing).toEqual([]);
    });
});
