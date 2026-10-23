import { readFileSync } from "fs";
import postcss from "postcss";
import { STYLE_IDS, type StyleId } from "@/theme/themeIds";

// Press feedback every style must give the v-press states and the segmented indicator
const PRESS = ["[data-pressed]", "[data-press-motion][data-pressed]", "[data-press-bounce]", ".segmented-indicator-motion"] as const;

// Each fragment must occur in some selector of that style's sheet
const REQUIRED_SELECTORS: Record<StyleId, readonly string[]> = {
    minimal: PRESS,
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
        '[data-skin~="check"]',
        '[data-skin~="continue"]',
        '[data-skin~="new-game"]',
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
