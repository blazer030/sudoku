import { readFileSync } from "fs";
import postcss from "postcss";

const ON_TILE = '[data-style="tactile"] [data-skin~="tile"][aria-pressed="true"]';

const declarationsOf = (selector: string): Map<string, string> => {
    const root = postcss.parse(readFileSync("src/style/styles/tactile.css", "utf8"));
    const declarations = new Map<string, string>();
    root.walkRules(rule => {
        if (!rule.selectors.includes(selector)) return;
        rule.walkDecls(declaration => {
            declarations.set(declaration.prop, declaration.value);
        });
    });
    return declarations;
};

describe("tactile option tiles", () => {
    it("should give a tile that is on an edge darker than its own fill, so its thickness reads", () => {
        const declarations = declarationsOf(ON_TILE);

        expect(declarations.get("box-shadow")).toContain("var(--tactile-edge-on-primary)");
        expect(declarationsOf('[data-style="tactile"]').get("--tactile-edge-on-primary")).toMatch(/var\(--color-primary\)/);
    });

    it("should not draw the lit top line across a tile that is on", () => {
        expect(declarationsOf(ON_TILE).get("box-shadow")).not.toContain("var(--tactile-highlight)");
    });
});
