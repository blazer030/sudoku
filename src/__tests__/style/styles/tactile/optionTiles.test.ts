import { readFileSync } from "fs";
import { declarationsOf } from "@/__tests__/style/styleSheetRules";

const TACTILE_CSS = readFileSync("src/style/styles/tactile/skin.css", "utf8");

const ON_TILE = '[data-style="tactile"] [data-skin~="tile"][aria-pressed="true"]';

describe("tactile option tiles", () => {
    it("should give a tile that is on an edge darker than its own fill, so its thickness reads", () => {
        const declarations = declarationsOf(TACTILE_CSS, ON_TILE);

        expect(declarations.get("box-shadow")).toContain("var(--tactile-edge-on-primary)");
        expect(declarationsOf(TACTILE_CSS, '[data-style="tactile"]').get("--tactile-edge-on-primary")).toMatch(/var\(--color-primary\)/);
    });

    it("should keep a tile that is on at least 3px thick, so its edge reads as a shadow", () => {
        const edge = /0 (\d+)px 0 var\(--tactile-edge-on-primary\)/.exec(declarationsOf(TACTILE_CSS, ON_TILE).get("box-shadow") ?? "");

        expect(Number(edge?.[1])).toBeGreaterThanOrEqual(3);
    });

    it("should not draw the lit top line across a tile that is on", () => {
        expect(declarationsOf(TACTILE_CSS, ON_TILE).get("box-shadow")).not.toContain("var(--tactile-highlight)");
    });
});
