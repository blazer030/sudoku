import { readdirSync, readFileSync } from "fs";
import { STYLE_IDS, type StyleId } from "@/application/SettingsStorage";
import { findLayoutDeclarations, findScalesOutOfRange, findUnguardedMotion, findUnscopedSelectors } from "./styleSheetRules";

const sheetOf = (style: StyleId): string => readFileSync(`src/style/styles/${style}.css`, "utf8");

describe("style sheet rules", () => {
    it("should flag layout properties but not placed decorations", () => {
        expect(findLayoutDeclarations('[data-style="tactile"] .x { padding: 2px }')).toHaveLength(1);
        expect(findLayoutDeclarations('[data-style="tactile"] .x::after { inset: 0 }')).toHaveLength(0);
        expect(findLayoutDeclarations('[data-style="tactile"] .x { position: absolute; color: red }')).toHaveLength(1);
        expect(findLayoutDeclarations('[data-style="tactile"] .x { position: relative; box-shadow: none }')).toHaveLength(0);
        expect(findLayoutDeclarations('[data-style="tactile"] [data-skin~="title-glyph"] { display: inline-block; margin-inline: 0.12em }')).toHaveLength(0);
        expect(findLayoutDeclarations('[data-style="tactile"] [data-skin~="title-glyph"] { padding: 2px }')).toHaveLength(1);
    });

    it("should flag selectors outside the style's scope", () => {
        expect(findUnscopedSelectors(".x { color: red }", "tactile")).toHaveLength(1);
        expect(findUnscopedSelectors('[data-style="paper"] .x { color: red }', "tactile")).toHaveLength(1);
        expect(findUnscopedSelectors('[data-style="tactile"] .x, :root.dark[data-style="tactile"] body { color: red }', "tactile")).toHaveLength(0);
        expect(findUnscopedSelectors("@keyframes press { to { opacity: 1 } }", "tactile")).toHaveLength(1);
        expect(findUnscopedSelectors("@keyframes tactile-press { to { opacity: 1 } }", "tactile")).toHaveLength(0);
    });

    it("should flag motion without a reduced-motion override", () => {
        expect(findUnguardedMotion('[data-style="paper"] .x { animation: paper-a 1s }')).toHaveLength(1);
        expect(findUnguardedMotion(`[data-style="paper"] .x { animation: paper-a 1s }
            @media (prefers-reduced-motion: reduce) { [data-style="paper"] .x { animation: none } }`)).toHaveLength(0);
        expect(findUnguardedMotion('[data-style="paper"] .x { transition: transform 1s }')).toHaveLength(1);
        expect(findUnguardedMotion(`[data-style="paper"] .x { transition: transform 1s }
            @media (prefers-reduced-motion: reduce) { [data-style="paper"] .x { transform: none } }`)).toHaveLength(0);
        expect(findUnguardedMotion('[data-style="paper"] .x { transition: color 1s; transition-duration: 2s }')).toHaveLength(0);
    });

    it("should flag type scales outside 1 to 1.5", () => {
        expect(findScalesOutOfRange('[data-style="paper"] { --entry-scale: 0.9 }')).toHaveLength(1);
        expect(findScalesOutOfRange('[data-style="paper"] { --entry-scale: 1.6 }')).toHaveLength(1);
        expect(findScalesOutOfRange('[data-style="paper"] { --entry-scale: 1.3; --note-scale: 1 }')).toHaveLength(0);
    });

    it.each(STYLE_IDS)("%s.css has no layout declarations", (style) => {
        expect(findLayoutDeclarations(sheetOf(style))).toEqual([]);
    });

    it.each(STYLE_IDS)("%s.css is scoped to its style", (style) => {
        expect(findUnscopedSelectors(sheetOf(style), style)).toEqual([]);
    });

    it.each(STYLE_IDS)("%s.css has a reduced-motion override for every moving rule", (style) => {
        expect(findUnguardedMotion(sheetOf(style))).toEqual([]);
    });

    it.each(STYLE_IDS)("%s.css keeps type scales between 1 and 1.5", (style) => {
        expect(findScalesOutOfRange(sheetOf(style))).toEqual([]);
    });

    it("should import every style's sheet", () => {
        const indexCss = readFileSync("src/style/index.css", "utf8");

        for (const style of STYLE_IDS) {
            expect(indexCss).toContain(`@import "./styles/${style}.css";`);
        }
        expect(readdirSync("src/style/styles").filter(name => name.endsWith(".css")).sort())
            .toEqual(STYLE_IDS.map(style => `${style}.css`).sort());
    });
});
