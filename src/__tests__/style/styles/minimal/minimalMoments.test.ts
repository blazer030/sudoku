import { readFileSync } from "fs";
import postcss, { type AtRule, type Node, type Rule } from "postcss";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import { GROUP_RIPPLE_STEP_MS } from "@/presentation/pages/game/useGroupEffect";
import { declarationsOf } from "../../styleSheetRules";

const MINIMAL_CSS = readFileSync("src/style/styles/minimal/skin.css", "utf8");

const SCOPE = '[data-style="minimal"]';
const BOARD = `${SCOPE} [data-skin~="board"]`;
const GROUP_CELL = `${BOARD} [data-group]:not(.animate-hint-reveal-glow)`;
const CELEBRATING_CELL = `${BOARD}:is([data-celebration="playing"], [data-celebration="done"]) [data-variant]`;
const STILL_ENTRY = `${BOARD}[data-celebration="still"] [data-value-kind="entered"]`;
const RISING_CARD = `${SCOPE} .minimal-celebration:not([data-still]) ~ [data-skin~="celebration"]`;
const STILL_CARD = `${SCOPE} .minimal-celebration[data-still] ~ [data-skin~="celebration"]`;
const RING = `${SCOPE} .minimal-celebration ~ [data-skin~="celebration"] [data-skin~="trophy"]::before`;
const DRAWING_RING = `${SCOPE} .minimal-celebration:not([data-still]) ~ [data-skin~="celebration"] [data-skin~="trophy"]::before`;
const LOADER_SQUARE = `${SCOPE} .minimal-loader-square`;

const isInReducedMotion = (rule: Rule): boolean => {
    let current: Node | undefined = rule.parent;
    while (current !== undefined) {
        if (current.type === "atrule" && (current as AtRule).params.includes("prefers-reduced-motion: reduce")) return true;
        current = current.parent;
    }
    return false;
};

// The declarations of the rules inside the reduced-motion block that list `selector`
const reducedMotionDeclarationsOf = (selector: string): Map<string, string> => {
    const declarations = new Map<string, string>();
    postcss.parse(MINIMAL_CSS).walkRules((rule: Rule) => {
        if (!isInReducedMotion(rule)) return;
        if (!rule.selectors.map(item => item.replace(/\s+/g, " ").trim()).includes(selector)) return;
        rule.walkDecls((declaration) => {
            declarations.set(declaration.prop, declaration.value.replace(/\s+/g, " ").trim());
        });
    });
    return declarations;
};

const millisecondsIn = (value: string): number[] => [...value.matchAll(/(\d+)ms/g)].map(match => Number(match[1]));

describe("minimal moments", () => {
    describe("group completion", () => {
        it("should wash a completed group's cells and lift their digits, rippling from the entered cell", () => {
            expect(declarationsOf(MINIMAL_CSS, GROUP_CELL).get("animation")).toMatch(/^minimal-group-wash .*var\(--group-delay/);
            expect(declarationsOf(MINIMAL_CSS, `${GROUP_CELL} > div`).get("animation")).toMatch(/^minimal-digit-lift .*var\(--group-delay/);
        });

        it("should end every cell's wash before the group effect's timer, its ripple step included", () => {
            const [duration, leadIn] = millisecondsIn(declarationsOf(MINIMAL_CSS, GROUP_CELL).get("animation") ?? "");
            const rippleStep = millisecondsIn(declarationsOf(MINIMAL_CSS, GROUP_CELL).get("--group-ripple-step") ?? "")[0];

            expect(leadIn + duration).toBeLessThanOrEqual(STYLE_MOMENTS.minimal.groupEffectMs);
            expect(rippleStep).toBeLessThanOrEqual(GROUP_RIPPLE_STEP_MS);
        });

        it("should stop the wash and the lift under reduced motion", () => {
            expect(reducedMotionDeclarationsOf(GROUP_CELL).get("animation")).toBe("none");
            expect(reducedMotionDeclarationsOf(`${GROUP_CELL} > div`).get("animation")).toBe("none");
        });
    });

    describe("celebration", () => {
        it("should wash the board diagonally while it plays and under the opened dialog", () => {
            expect(declarationsOf(MINIMAL_CSS, CELEBRATING_CELL).get("animation"))
                .toMatch(/^minimal-board-wash .*var\(--cell-row\) \+ var\(--cell-column\)/);
            expect(declarationsOf(MINIMAL_CSS, `${CELEBRATING_CELL} > div`).get("animation")).toMatch(/^minimal-digit-lift /);
        });

        it("should raise the card and draw the ring around the trophy", () => {
            expect(declarationsOf(MINIMAL_CSS, RISING_CARD).get("animation")).toMatch(/^minimal-card-rise /);
            expect(declarationsOf(MINIMAL_CSS, RING).get("box-shadow")).toContain("var(--color-primary)");
            expect(declarationsOf(MINIMAL_CSS, DRAWING_RING).get("animation")).toMatch(/^minimal-ring-draw /);
            expect(declarationsOf(MINIMAL_CSS, `${RISING_CARD} [data-skin~="new-record"]`).get("animation")).toMatch(/^minimal-badge-pop /);
            expect(declarationsOf(MINIMAL_CSS, `${RISING_CARD} [data-skin~="trophy"] > svg`).get("animation")).toMatch(/^minimal-trophy-bounce /);
        });

        it("should show the still end state: tinted entries, the ring drawn and a card that only fades in", () => {
            expect(declarationsOf(MINIMAL_CSS, STILL_ENTRY).get("background-color")).toContain("var(--color-primary-light)");
            expect(declarationsOf(MINIMAL_CSS, STILL_ENTRY).has("animation")).toBe(false);
            expect(declarationsOf(MINIMAL_CSS, RING).has("animation")).toBe(false);
            expect(declarationsOf(MINIMAL_CSS, STILL_CARD).get("transform")).toBe("none");
            expect(declarationsOf(MINIMAL_CSS, STILL_CARD).has("animation")).toBe(false);
        });

        it("should stop every part of it under reduced motion", () => {
            for (const selector of [CELEBRATING_CELL, `${CELEBRATING_CELL} > div`, RISING_CARD, DRAWING_RING,
                `${RISING_CARD} [data-skin~="new-record"]`, `${RISING_CARD} [data-skin~="trophy"] > svg`]) {
                expect(reducedMotionDeclarationsOf(selector).get("animation")).toBe("none");
            }
        });
    });

    describe("loader", () => {
        it("should light each square in its turn on a loop", () => {
            expect(declarationsOf(MINIMAL_CSS, LOADER_SQUARE).get("animation"))
                .toMatch(/^minimal-loader-place .*var\(--minimal-loader-step\).* infinite/);
        });

        it("should light its squares brighter on the dark card", () => {
            const light = declarationsOf(MINIMAL_CSS, `${SCOPE} .minimal-loader`);
            const dark = declarationsOf(MINIMAL_CSS, `:root.dark${SCOPE} .minimal-loader`);

            expect(light.get("--minimal-loader-lit")).toBe("var(--color-highlight)");
            expect(dark.get("--minimal-loader-lit")).toContain("var(--color-on-scrim)");
            expect(dark.get("background-color")).toBeDefined();
        });

        it("should hold every other square lit under reduced motion", () => {
            expect(reducedMotionDeclarationsOf(LOADER_SQUARE).get("animation")).toBe("none");
            expect(reducedMotionDeclarationsOf(`${LOADER_SQUARE}:nth-child(odd)`).get("background-color")).toBe("var(--minimal-loader-lit)");
        });
    });
});
