import { readFileSync } from "fs";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import { GROUP_RIPPLE_STEP_MS } from "@/presentation/pages/game/useGroupEffect";
import { animationTimingOf, declarationsOf, reducedMotionDeclarationsOf as reducedMotionDeclarationsIn } from "../../styleSheetRules";

const TACTILE_CSS = readFileSync("src/style/styles/tactile/skin.css", "utf8");

const SCOPE = '[data-style="tactile"]';
const BOARD = `${SCOPE} [data-skin~="board"]`;
const GROUP_CELL = `${BOARD} [data-group]:not(.animate-hint-reveal-glow)`;
const GROUP_SHADE = `${GROUP_CELL}::before`;
const GROUP_DIGIT = `${GROUP_CELL} > div`;
const CELEBRATING_CELL = `${BOARD}:is([data-celebration="playing"], [data-celebration="done"]) [data-variant]`;
const CELEBRATING_EDGE = `${CELEBRATING_CELL}::after`;
const STILL_ENTRY = `${BOARD}[data-celebration="still"] [data-value-kind="entered"]`;
const CARD = `${SCOPE} [data-skin~="card"][data-skin~="celebration"]`;
const DROPPING_CARD = `${CARD}:not([data-still])`;
const STILL_CARD = `${CARD}[data-still]`;
const TROPHY = `${CARD} [data-skin~="trophy"]`;
const LOADER_TILE = `${SCOPE} .tactile-loader-tile`;
const LOADER_FACE = `${SCOPE} .tactile-loader-face`;

const reducedMotionDeclarationsOf = (selector: string): Map<string, string> => reducedMotionDeclarationsIn(TACTILE_CSS, selector);

// The note's advice: 81 pieces moving box-shadow at once is costly, so the thickness is drawn once and only moved
const keyframesAnimateBoxShadow = (css: string): string[] => [...css.matchAll(/@keyframes (tactile-[\w-]+)\s*\{([\s\S]*?)\n\}/g)]
    .filter(([, , body]) => body.includes("box-shadow"))
    .map(([, name]) => name);

describe("tactile moments", () => {
    it("should move its pieces with transform and opacity only, never by animating box-shadow", () => {
        expect(keyframesAnimateBoxShadow(TACTILE_CSS)).toEqual([]);
    });

    describe("group completion", () => {
        it("should press each piece of a completed group in turn, rippling from the entered cell", () => {
            expect(declarationsOf(TACTILE_CSS, GROUP_SHADE).get("animation")).toMatch(/^tactile-group-shade .*var\(--group-delay/);
            expect(declarationsOf(TACTILE_CSS, GROUP_DIGIT).get("animation")).toMatch(/^tactile-group-press .*var\(--group-delay/);
        });

        // The entered digit is always in its own completed group, so it must still drop in under the press
        it("should keep the entered digit's drop-in under the press", () => {
            const animation = declarationsOf(TACTILE_CSS, `${GROUP_DIGIT}.value-arrive`).get("animation") ?? "";

            expect(animationTimingOf(animation, "tactile-drop")).not.toBeNull();
            expect(animationTimingOf(animation, "tactile-group-press")).not.toBeNull();
            expect(reducedMotionDeclarationsOf(`${GROUP_DIGIT}.value-arrive`).get("animation")).toBe("none");
        });

        it("should draw the pressed piece as a sunk tray tinted with the theme colour", () => {
            const shade = declarationsOf(TACTILE_CSS, GROUP_SHADE);

            expect(shade.get("background-color")).toContain("var(--color-primary)");
            expect(shade.get("box-shadow")).toMatch(/^inset /);
            expect(shade.get("opacity")).toBe("0");
        });

        it("should replace the shared flash on the cell itself", () => {
            expect(declarationsOf(TACTILE_CSS, GROUP_CELL).get("animation")).toBe("none");
        });

        it.each([
            [GROUP_SHADE, "tactile-group-shade"],
            [GROUP_DIGIT, "tactile-group-press"],
        ])("should end %s's %s within the group effect's own time", (selector, name) => {
            const timing = animationTimingOf(declarationsOf(TACTILE_CSS, selector).get("animation") ?? "", name);

            expect(timing).not.toBeNull();
            expect((timing?.fixedDelayMs ?? 0) + (timing?.durationMs ?? 0)).toBeLessThanOrEqual(STYLE_MOMENTS.tactile.groupEffectMs);
        });

        it("should ripple no slower than the group effect's timer counts", () => {
            const rippleStep = declarationsOf(TACTILE_CSS, GROUP_CELL).get("--group-ripple-step") ?? "";

            expect(rippleStep).toMatch(/^\d+ms$/);
            expect(Number.parseFloat(rippleStep)).toBeLessThanOrEqual(GROUP_RIPPLE_STEP_MS);
        });

        it("should stop the press under reduced motion", () => {
            expect(reducedMotionDeclarationsOf(GROUP_SHADE).get("animation")).toBe("none");
            expect(reducedMotionDeclarationsOf(GROUP_DIGIT).get("animation")).toBe("none");
        });
    });

    describe("celebration", () => {
        it("should spring the boxes up one after another, each showing its edge as it rises", () => {
            expect(declarationsOf(TACTILE_CSS, CELEBRATING_CELL).get("animation")).toMatch(/^tactile-box-lift .*var\(--cell-box\)/);
            expect(declarationsOf(TACTILE_CSS, CELEBRATING_EDGE).get("animation")).toMatch(/^tactile-box-edge .*var\(--cell-box\)/);
            expect(declarationsOf(TACTILE_CSS, CELEBRATING_EDGE).get("background-color")).toBe("var(--tactile-edge)");
        });

        it("should drop the card in like a tile, press the trophy key once and drop the new-record badge in", () => {
            expect(declarationsOf(TACTILE_CSS, DROPPING_CARD).get("animation")).toMatch(/^tactile-card-drop .* backwards$/);
            expect(declarationsOf(TACTILE_CSS, `${DROPPING_CARD} [data-skin~="trophy"]::before`).get("animation")).toMatch(/^tactile-trophy-press /);
            expect(declarationsOf(TACTILE_CSS, `${DROPPING_CARD} [data-skin~="trophy"] > svg`).get("animation")).toMatch(/^tactile-trophy-press /);
            expect(declarationsOf(TACTILE_CSS, `${DROPPING_CARD} [data-skin~="new-record"]`).get("animation")).toMatch(/^tactile-badge-drop /);
        });

        it("should make the trophy a solid key on a darker edge", () => {
            expect(declarationsOf(TACTILE_CSS, TROPHY).get("box-shadow")).toContain("var(--tactile-edge-on-primary)");
            expect(declarationsOf(TACTILE_CSS, `${TROPHY}::before`).get("background-color")).toBe("var(--color-primary)");
            expect(declarationsOf(TACTILE_CSS, `${TROPHY} > svg`).get("color")).toBe("var(--color-on-primary)");
        });

        it("should show the still end state: thicker entries and the trophy key resting pressed", () => {
            expect(declarationsOf(TACTILE_CSS, STILL_ENTRY).get("--tw-inset-shadow")).toContain("var(--color-primary)");
            expect(declarationsOf(TACTILE_CSS, `${STILL_CARD} [data-skin~="trophy"]::before`).get("transform")).toMatch(/^translateY\(\d/);
            expect(declarationsOf(TACTILE_CSS, `${STILL_CARD} [data-skin~="trophy"] > svg`).get("transform")).toMatch(/^translateY\(\d/);
            expect(declarationsOf(TACTILE_CSS, STILL_ENTRY).has("animation")).toBe(false);
            expect(declarationsOf(TACTILE_CSS, CARD).has("animation")).toBe(false);
        });

        it("should stop every part of it under reduced motion", () => {
            for (const selector of [CELEBRATING_CELL, CELEBRATING_EDGE, DROPPING_CARD, `${DROPPING_CARD} [data-skin~="trophy"]::before`,
                `${DROPPING_CARD} [data-skin~="trophy"] > svg`, `${DROPPING_CARD} [data-skin~="new-record"]`]) {
                expect(reducedMotionDeclarationsOf(selector).get("animation")).toBe("none");
            }
        });
    });

    describe("loader", () => {
        it("should drop each tile into the tray in its turn, then press them all together, on a loop", () => {
            expect(declarationsOf(TACTILE_CSS, LOADER_TILE).get("animation"))
                .toMatch(/^tactile-loader-stack .*var\(--tactile-loader-step\).* infinite/);
            expect(declarationsOf(TACTILE_CSS, LOADER_FACE).get("animation"))
                .toMatch(/^tactile-loader-press .*var\(--tactile-loader-step\).* infinite/);
        });

        it("should raise the card on the tactile edge", () => {
            expect(declarationsOf(TACTILE_CSS, `${SCOPE} .tactile-loader`).get("box-shadow")).toContain("var(--tactile-edge)");
        });

        it("should hold the first four tiles in place under reduced motion", () => {
            expect(reducedMotionDeclarationsOf(LOADER_TILE).get("animation")).toBe("none");
            expect(reducedMotionDeclarationsOf(LOADER_FACE).get("animation")).toBe("none");
            expect(reducedMotionDeclarationsOf(`${SCOPE} .tactile-loader-cell:nth-child(n+5) .tactile-loader-tile`).get("opacity")).toBe("0");
        });
    });
});
