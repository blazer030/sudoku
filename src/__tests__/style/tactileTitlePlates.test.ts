import { readFileSync } from "fs";
import postcss from "postcss";

// Home's heading is text-4xl (36px) and sits gap-2 (8px) above the subtitle
const TITLE_FONT_PX = 36;
const TITLE_TO_SUBTITLE_PX = 8;
const TITLE_GLYPH = '[data-style="tactile"] [data-skin~="title-glyph"]';

// Splits on commas or spaces that are not inside parentheses
const splitTopLevel = (value: string, separator: RegExp): string[] => {
    const parts: string[] = [];
    let depth = 0;
    let current = "";
    for (const character of value) {
        if (character === "(") depth += 1;
        if (character === ")") depth -= 1;
        if (depth === 0 && separator.test(character)) {
            if (current.trim() !== "") parts.push(current.trim());
            current = "";
        } else {
            current += character;
        }
    }
    if (current.trim() !== "") parts.push(current.trim());
    return parts;
};

/** A px or em length, a custom property holding one, or a calc() sum of them, in px. */
const toPixels = (token: string, variables: ReadonlyMap<string, string>): number | null => {
    const variable = /^var\((--[\w-]+)\)$/.exec(token);
    if (variable !== null) {
        const resolved = variables.get(variable[1]);
        return resolved === undefined ? null : toPixels(resolved, variables);
    }
    const sum = /^calc\((.*)\)$/.exec(token);
    if (sum !== null) {
        const terms = sum[1].split(/\s+\+\s+/).map(term => toPixels(term.trim(), variables));
        return terms.every(term => term !== null) ? terms.reduce((total, term) => total + term, 0) : null;
    }
    const length = /^(-?\d*\.?\d+)(px|em)?$/.exec(token);
    if (length === null) return null;
    return Number(length[1]) * (length[2] === "em" ? TITLE_FONT_PX : 1);
};

/** How far each unblurred shadow layer (the plate and its edge) reaches below the glyph's box. */
const plateReachesBelow = (css: string): number[] => {
    const variables = new Map<string, string>();
    let boxShadow: string | undefined;
    postcss.parse(css).walkRules((rule) => {
        const selector = rule.selector.replace(/\s+/g, " ").trim();
        if (selector === '[data-style="tactile"]') {
            rule.walkDecls(/^--/, (declaration) => { variables.set(declaration.prop, declaration.value.trim()); });
        }
        if (selector === TITLE_GLYPH) {
            rule.walkDecls("box-shadow", (declaration) => { boxShadow = declaration.value; });
        }
    });
    if (boxShadow === undefined) throw new Error("tactile.css draws no title plate");
    return splitTopLevel(boxShadow, /,/).flatMap((layer) => {
        const lengths = splitTopLevel(layer, /\s/).map(token => toPixels(token, variables)).filter(length => length !== null);
        const [, offsetY, blur = 0, spread = 0] = lengths;
        return blur === 0 ? [offsetY + spread] : [];
    });
};

describe("tactile title plates", () => {
    it("should still sit on Home's heading at the size and gap the check assumes", () => {
        const home = readFileSync("src/presentation/pages/home/Home.vue", "utf8");

        expect(home).toMatch(/<div class="flex flex-col items-center gap-2">\s*<div/);
        expect(home).toMatch(/<h1\s+class="[^"]*\btext-4xl\b[^"]*"\s+data-skin="title"/);
    });

    it("should end each plate above the subtitle", () => {
        const reaches = plateReachesBelow(readFileSync("src/style/styles/tactile.css", "utf8"));

        expect(reaches.length).toBeGreaterThan(0);
        for (const reach of reaches) expect(reach).toBeLessThan(TITLE_TO_SUBTITLE_PX);
    });

    it("should measure the plates that once reached the subtitle", () => {
        // The plates before 17e3577: a 0.1em spread on a 4px-deep edge reached 11.2px down
        const before = `[data-style="tactile"] { --tactile-depth: 4px; }
            ${TITLE_GLYPH} {
                box-shadow:
                    0 0 0 0.1em var(--color-card),
                    0 calc(0.1em + var(--tactile-depth)) 0 0.1em var(--tactile-edge),
                    0 calc(0.1em + var(--tactile-depth) + 2px) 8px 0.1em var(--tactile-drop-shadow);
            }`;

        expect(Math.max(...plateReachesBelow(before))).toBeCloseTo(11.2, 5);
    });
});
