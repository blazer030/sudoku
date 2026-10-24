import { readFileSync } from "fs";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import { GROUP_RIPPLE_STEP_MS } from "@/presentation/pages/game/useGroupEffect";
import { animationTimingOf, declarationsOf, reducedMotionDeclarationsOf as reducedMotionDeclarationsIn } from "../../styleSheetRules";

const MINIMAL_CSS = readFileSync("src/style/styles/minimal/skin.css", "utf8");

const SCOPE = '[data-style="minimal"]';
const BOARD = `${SCOPE} [data-skin~="board"]`;
const GROUP_CELL = `${BOARD} [data-group]:not(.animate-hint-reveal-glow)`;
const CELEBRATING_CELL = `${BOARD}:is([data-celebration="playing"], [data-celebration="done"]) [data-variant]`;
const STILL_ENTRY = `${BOARD}[data-celebration="still"] [data-value-kind="entered"]`;
const CARD = `${SCOPE} [data-skin~="card"][data-skin~="celebration"]`;
const RISING_CARD = `${CARD}:not([data-still])`;
const RING = `${CARD} [data-skin~="trophy"]::before`;
const DRAWING_RING = `${RISING_CARD} [data-skin~="trophy"]::before`;
const LOADER_SQUARE = `${SCOPE} .minimal-loader-square`;

const reducedMotionDeclarationsOf = (selector: string): Map<string, string> => reducedMotionDeclarationsIn(MINIMAL_CSS, selector);

describe("minimal moments", () => {
    describe("group completion", () => {
        it("should wash a completed group's cells and lift their digits, rippling from the entered cell", () => {
            expect(declarationsOf(MINIMAL_CSS, GROUP_CELL).get("animation")).toMatch(/^minimal-group-wash .*var\(--group-delay/);
            expect(declarationsOf(MINIMAL_CSS, `${GROUP_CELL} > div`).get("animation")).toMatch(/^minimal-digit-lift .*var\(--group-delay/);
        });

        it.each([
            [GROUP_CELL, "minimal-group-wash"],
            [`${GROUP_CELL} > div`, "minimal-digit-lift"],
        ])("should end %s's %s within the group effect's own time", (selector, name) => {
            const timing = animationTimingOf(declarationsOf(MINIMAL_CSS, selector).get("animation") ?? "", name);

            expect(timing).not.toBeNull();
            expect((timing?.fixedDelayMs ?? 0) + (timing?.durationMs ?? 0)).toBeLessThanOrEqual(STYLE_MOMENTS.minimal.groupEffectMs);
        });

        it("should ripple no slower than the group effect's timer counts", () => {
            const rippleStep = declarationsOf(MINIMAL_CSS, GROUP_CELL).get("--group-ripple-step") ?? "";

            expect(rippleStep).toMatch(/^\d+ms$/);
            expect(Number.parseFloat(rippleStep)).toBeLessThanOrEqual(GROUP_RIPPLE_STEP_MS);
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

        it("should show the still end state: tinted entries and the ring already drawn", () => {
            expect(declarationsOf(MINIMAL_CSS, STILL_ENTRY).get("background-color")).toContain("var(--color-primary-light)");
            expect(declarationsOf(MINIMAL_CSS, STILL_ENTRY).has("animation")).toBe(false);
            expect(declarationsOf(MINIMAL_CSS, RING).has("animation")).toBe(false);
            expect(declarationsOf(MINIMAL_CSS, CARD).has("animation")).toBe(false);
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
