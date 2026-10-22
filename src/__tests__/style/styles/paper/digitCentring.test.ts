import { readFileSync } from "fs";
import postcss, { type Rule } from "postcss";

// Caveat's digits overhang their advance to the right: measured in a browser, each digit's ink sits
// 0.09–0.14em right of its advance box's centre, and cells and keys centre the advance box. Once
// Caveat is in use (styles/paper/fonts.ts marks it ready) paper nudges the handwritten digits back by the
// mean overhang with the translate property, which moves the ink without changing any box.

const PAPER_CSS = readFileSync("src/style/styles/paper/skin.css", "utf8");
const READY = '[data-style="paper"][data-paper-fonts="ready"]';
const HAND_DIGITS = [`${READY} .font-entry`, `${READY} .font-note`, `${READY} .font-key > span`];

const declarationsOf = (selector: string): Map<string, string> => {
    const declarations = new Map<string, string>();
    postcss.parse(PAPER_CSS).walkRules((rule: Rule) => {
        if (rule.parent?.type === "atrule") return;
        if (!rule.selectors.map(item => item.replace(/\s+/g, " ").trim()).includes(selector)) return;
        rule.walkDecls((declaration) => {
            declarations.set(declaration.prop, declaration.value.replace(/\s+/g, " ").trim());
        });
    });
    return declarations;
};

const translatedSelectors = (): string[] => {
    const selectors: string[] = [];
    postcss.parse(PAPER_CSS).walkRules((rule: Rule) => {
        if (rule.nodes.some(node => node.type === "decl" && node.prop === "translate")) {
            selectors.push(...rule.selectors.map(item => item.replace(/\s+/g, " ").trim()));
        }
    });
    return selectors;
};

describe("paper handwritten digit centring", () => {
    it("should nudge entries, notes and key digits left by Caveat's overhang once Caveat is in use", () => {
        expect(declarationsOf(READY).get("--paper-hand-nudge")).toBe("-0.12em");
        for (const selector of HAND_DIGITS) {
            expect(declarationsOf(selector).get("translate"), selector).toBe("var(--paper-hand-nudge) 0");
        }
    });

    it("should leave the fallback faces where they are, since they do not overhang", () => {
        const unguarded = translatedSelectors()
            .filter(selector => /\.font-(?:entry|note|key)\b/.test(selector))
            .filter(selector => !selector.startsWith(READY));

        expect(unguarded).toEqual([]);
    });

    it("should keep a highlighted note's circle centred on the nudged ink", () => {
        // The circle is centred on the note's box, which the nudge moved left of the ink by the same amount
        const circle = declarationsOf(`${READY} [data-note-highlight]::after`);

        expect(circle.get("translate")).toBe("calc(-50% - var(--paper-hand-nudge)) -50%");
    });
});
