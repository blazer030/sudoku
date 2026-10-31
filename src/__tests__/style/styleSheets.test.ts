import { existsSync, readdirSync, readFileSync } from "fs";
import { STYLE_IDS, type StyleId } from "@/theme/themeIds";
import { animationTimingOf, findCrossEngineHazards, findLayoutDeclarations, findScalesOutOfRange, findUnguardedMotion, findUnscopedSelectors, reducedMotionDeclarationsOf } from "./styleSheetRules";

// The styles held to the cross-engine rules so far. paper, pixel and cyber still find a cell by :has(),
// cyber's arrival and loader carry a drop-shadow while they animate, chalkboard's erase smear animates a
// blur and blueprint's loader pen rides an offset-path; each joins the list once it is brought in line.
const CROSS_ENGINE_STYLES: readonly StyleId[] = ["ink"];

const sheetOf = (style: StyleId): string => readFileSync(`src/style/styles/${style}/skin.css`, "utf8");

describe("style sheet rules", () => {
    it("should flag layout properties but not placed decorations", () => {
        expect(findLayoutDeclarations('[data-style="tactile"] .x { padding: 2px }')).toHaveLength(1);
        expect(findLayoutDeclarations('[data-style="tactile"] .x::after { inset: 0 }')).toHaveLength(0);
        expect(findLayoutDeclarations('[data-style="tactile"] .x { position: absolute; color: red }')).toHaveLength(1);
        expect(findLayoutDeclarations('[data-style="tactile"] .x { position: relative; box-shadow: none }')).toHaveLength(0);
        expect(findLayoutDeclarations('[data-style="tactile"] [data-skin~="title-glyph"] { display: inline-block; margin-inline: 0.12em }')).toHaveLength(0);
        expect(findLayoutDeclarations('[data-style="tactile"] [data-skin~="title-glyph"] { padding: 2px }')).toHaveLength(1);
        const chalkDigits = '[data-style="chalkboard"] [data-skin~="board"] [data-variant] > :is(.font-clue, .font-entry)';
        expect(findLayoutDeclarations(`${chalkDigits} { padding-inline: 0.1em; margin-inline: -0.1em }`)).toHaveLength(0);
        expect(findLayoutDeclarations(`${chalkDigits} { padding-inline: 0.2em; margin-inline: -0.1em }`)).toHaveLength(1);
        expect(findLayoutDeclarations('[data-style="chalkboard"] [data-variant] > div { padding-inline: 0.1em }')).toHaveLength(1);
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

    it("should read an animation's duration and fixed delay by its name", () => {
        expect(animationTimingOf("paper-a 520ms ease-out calc(100ms + var(--group-delay, 0ms))", "paper-a")).toEqual({ durationMs: 520, fixedDelayMs: 100 });
        expect(animationTimingOf("paper-a 1s, paper-b 0.3s linear 2s both", "paper-b")).toEqual({ durationMs: 300, fixedDelayMs: 2000 });
        expect(animationTimingOf("paper-a 1s", "paper-b")).toBeNull();
    });

    it("should read declarations from inside the reduced-motion block only", () => {
        const css = `[data-style="paper"] .x { animation: paper-a 1s }
            @media (prefers-reduced-motion: reduce) { [data-style="paper"] .x { animation: none } }`;

        expect(reducedMotionDeclarationsOf(css, '[data-style="paper"] .x').get("animation")).toBe("none");
    });

    it("should flag what draws differently from engine to engine", () => {
        expect(findCrossEngineHazards('[data-style="ink"] [data-variant]:has(> .value-arrive)::before { opacity: 0 }')).toHaveLength(1);
        expect(findCrossEngineHazards('[data-style="ink"] [data-variant][data-arriving]::before { opacity: 0 }')).toHaveLength(0);
        expect(findCrossEngineHazards("@keyframes ink-a { to { filter: blur(2px) } }")).toHaveLength(1);
        expect(findCrossEngineHazards("@keyframes ink-a { to { backdrop-filter: blur(2px) } }")).toHaveLength(1);
        expect(findCrossEngineHazards('[data-style="ink"] .x { filter: drop-shadow(0 0 2px red); animation: ink-a 1s }')).toHaveLength(1);
        expect(findCrossEngineHazards(`[data-style="ink"] .x { animation: ink-a 1s }
            [data-style="ink"] .x { filter: blur(1px) }`)).toHaveLength(1);
        expect(findCrossEngineHazards('[data-style="ink"] .x { filter: blur(1px) }')).toHaveLength(0);
        expect(findCrossEngineHazards('[data-style="ink"] .x { filter: none; animation: ink-a 1s }')).toHaveLength(0);
        expect(findCrossEngineHazards('[data-style="ink"] .x { -webkit-mask-image: url(#pen) }')).toHaveLength(1);
        expect(findCrossEngineHazards('[data-style="ink"] .x { mask-image: url("@/style/styles/ink/a.svg") }')).toHaveLength(0);
        expect(findCrossEngineHazards('[data-style="ink"] .x { offset-path: path("M0 0") }')).toHaveLength(1);
    });

    it.each(CROSS_ENGINE_STYLES)("%s.css draws alike in every engine: no :has(), no mask by url(#…), no offset-path, no animated filter", (style) => {
        expect(findCrossEngineHazards(sheetOf(style))).toEqual([]);
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
            expect(indexCss).toContain(`@import "./styles/${style}/skin.css";`);
        }
        const folders = readdirSync("src/style/styles", { withFileTypes: true }).filter(entry => entry.isDirectory());
        expect(folders.map(folder => folder.name).sort()).toEqual([...STYLE_IDS].sort());
        for (const style of STYLE_IDS) {
            expect(existsSync(`src/style/styles/${style}/skin.css`)).toBe(true);
        }
    });
});
