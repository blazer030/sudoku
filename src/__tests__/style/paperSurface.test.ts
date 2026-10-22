import { readFileSync } from "fs";
import postcss, { type Rule } from "postcss";

// Paper's page surface (the page colour, the dot texture and, at night, the lamp) is painted on the
// body, the app root and every page root and sticky header. Each lays the whole surface down on
// the page colour, so where they overlap the lamp is never painted twice.

const PAPER_CSS = readFileSync("src/style/styles/paper.css", "utf8");

const declarationsBySelector = (): Map<string, Map<string, string>> => {
    const bySelector = new Map<string, Map<string, string>>();
    postcss.parse(PAPER_CSS).walkRules((rule: Rule) => {
        for (const selector of rule.selectors.map(item => item.replace(/\s+/g, " ").trim())) {
            const declarations = bySelector.get(selector) ?? new Map<string, string>();
            rule.walkDecls((declaration) => {
                declarations.set(declaration.prop, declaration.value.replace(/\s+/g, " ").trim());
            });
            bySelector.set(selector, declarations);
        }
    });
    return bySelector;
};

const surfaceSelectors = (): string[] => [...declarationsBySelector()]
    .filter(([, declarations]) => declarations.get("background-image")?.includes("var(--paper-lamp)") ?? false)
    .map(([selector]) => selector);

describe("paper surface", () => {
    it("should paint the lamp only on the page colour, so overlapping surfaces never double it", () => {
        const bySelector = declarationsBySelector();
        const selectors = surfaceSelectors();

        expect(selectors).toEqual(expect.arrayContaining([
            '[data-style="paper"] body',
            '[data-style="paper"] [data-skin~="page"]',
            '[data-style="paper"] [data-skin~="page-header"]',
            '[data-style="paper"] [data-skin~="page-ruled"]',
        ]));
        for (const selector of selectors) {
            expect(bySelector.get(selector)?.get("background-color"), selector).toBe("var(--color-background)");
        }
    });
});
