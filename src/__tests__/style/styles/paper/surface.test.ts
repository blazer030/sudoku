import { readFileSync } from "fs";
import postcss, { type Rule } from "postcss";

// Paper's page surface (the page colour and the dot texture) is painted on the body, the app root
// and every page root and sticky header. Each lays the whole surface down on the page colour.

const PAPER_CSS = readFileSync("src/style/styles/paper/skin.css", "utf8");

const declarationsBySelector = (): Map<string, Map<string, string>> => {
    const bySelector = new Map<string, Map<string, string>>();
    postcss.parse(PAPER_CSS).walkRules((rule: Rule) => {
        for (const selector of rule.selectors.map(item => item.replace(/\s+/g, " ").trim())) {
            const declarations = bySelector.get(selector) ?? new Map<string, string>();
            rule.walkDecls((declaration) => {
                declarations.set(declaration.prop, declaration.value.replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")").trim());
            });
            bySelector.set(selector, declarations);
        }
    });
    return bySelector;
};

const surfaceSelectors = (): string[] => [...declarationsBySelector()]
    .filter(([, declarations]) => declarations.get("background-image")?.includes("var(--paper-texture)") ?? false)
    .map(([selector]) => selector);

describe("paper surface", () => {
    it("should paint the texture only on the page colour", () => {
        const bySelector = declarationsBySelector();
        const selectors = surfaceSelectors();

        expect(selectors).toEqual(expect.arrayContaining([
            '[data-style="paper"] body',
            '[data-style="paper"] [data-skin~="page"]',
            '[data-style="paper"] [data-skin~="page-header"][data-scrolled]',
            '[data-style="paper"] [data-skin~="page-ruled"]',
        ]));
        for (const selector of selectors) {
            expect(bySelector.get(selector)?.get("background-color"), selector).toBe("var(--color-background)");
        }
    });

    it("should paint the surface on the app root, so it runs on under the status bar", () => {
        // Edge to edge, the app root's top padding sits under the status bar; page roots start below
        // it. The root lays the surface on its own box, which starts at the top of the screen.
        const appRoot = '[data-style="paper"] .app-safe-area';

        expect(surfaceSelectors()).toContain(appRoot);
        expect(declarationsBySelector().get(appRoot)?.get("background-attachment") ?? "scroll").not.toContain("fixed");
    });
});
