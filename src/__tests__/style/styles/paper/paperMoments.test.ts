import { readFileSync } from "fs";
import postcss from "postcss";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import { GROUP_RIPPLE_STEP_MS } from "@/presentation/pages/game/useGroupEffect";
import { animationTimingOf, declarationsOf, reducedMotionDeclarationsOf as reducedMotionDeclarationsIn } from "../../styleSheetRules";

const PAPER_CSS = readFileSync("src/style/styles/paper/skin.css", "utf8");

const SCOPE = '[data-style="paper"]';
const BOARD = `${SCOPE} [data-skin~="board"]`;
const GROUP_CELL = `${BOARD} [data-group]:not(.animate-hint-reveal-glow)`;
const STRIKE = `${SCOPE} :is(.paper-group-row, .paper-group-column) .paper-group-stroke`;
const LOOP = `${SCOPE} .paper-group-box .paper-group-stroke`;
const CHECK = `${BOARD}:is([data-celebration="playing"], [data-celebration="done"], [data-celebration="still"]) > div::after`;
const DRAWING_CHECK = `${BOARD}:is([data-celebration="playing"], [data-celebration="done"]) > div::after`;
const CARD = `${SCOPE} [data-skin~="card"][data-skin~="celebration"]`;
const LANDING_CARD = `${CARD}:not([data-still])`;
const UNDERLINE = `${CARD} [data-skin~="complete-title"]::after`;
const DRAWING_UNDERLINE = `${LANDING_CARD} [data-skin~="complete-title"]::after`;
const STAMP = `${SCOPE} .paper-stamp`;
const STAMPING = `${LANDING_CARD} .paper-stamp`;
const SPLAT = `${SCOPE} .paper-stamp-splat`;
const SPREADING_SPLAT = `${LANDING_CARD} .paper-stamp-splat`;
const LOADER_LINE = `${SCOPE} .paper-loader-line`;
const LOADER_DIGIT = `${SCOPE} .paper-loader-digit`;

const reducedMotionDeclarationsOf = (selector: string): Map<string, string> => reducedMotionDeclarationsIn(PAPER_CSS, selector);

const animationOf = (selector: string): string => declarationsOf(PAPER_CSS, selector).get("animation") ?? "";

// The first and last frames of a keyframes block, as "property: value" lists
const keyframeEnds = (name: string): { from: Map<string, string>; to: Map<string, string> } => {
    const frames: Map<string, string>[] = [];
    postcss.parse(PAPER_CSS).walkAtRules("keyframes", (atRule) => {
        if (atRule.params !== name) return;
        atRule.walkRules((frame) => {
            const declarations = new Map<string, string>();
            frame.walkDecls((declaration) => { declarations.set(declaration.prop, declaration.value.trim()); });
            frames.push(declarations);
        });
    });
    return { from: frames[0] ?? new Map(), to: frames[frames.length - 1] ?? new Map() };
};

describe("paper moments", () => {
    describe("group completion", () => {
        it("should wash a completed group's cells in pale ink, rippling from the entered cell", () => {
            expect(animationOf(GROUP_CELL)).toMatch(/^paper-group-wash .*var\(--group-delay/);
        });

        it("should end the wash within the group effect's own time, rippling no slower than its timer counts", () => {
            const timing = animationTimingOf(animationOf(GROUP_CELL), "paper-group-wash");
            const rippleStep = declarationsOf(PAPER_CSS, GROUP_CELL).get("--group-ripple-step") ?? "";

            expect(timing).not.toBeNull();
            expect((timing?.fixedDelayMs ?? 0) + (timing?.durationMs ?? 0)).toBeLessThanOrEqual(STYLE_MOMENTS.paper.groupEffectMs);
            expect(rippleStep).toMatch(/^\d+ms$/);
            expect(Number.parseFloat(rippleStep)).toBeLessThanOrEqual(GROUP_RIPPLE_STEP_MS);
        });

        it("should strike a row or column through and loop a box a beat later, in the theme's ink", () => {
            const strike = animationTimingOf(animationOf(STRIKE), "paper-group-strike");
            const loop = animationTimingOf(animationOf(LOOP), "paper-group-strike");

            expect(strike).not.toBeNull();
            expect(loop?.fixedDelayMs).toBe((strike?.fixedDelayMs ?? 0) + 80);
            expect(declarationsOf(PAPER_CSS, `${SCOPE} .paper-group-stroke`).get("stroke")).toBe("var(--color-primary)");
        });

        // The overlay lives as long as the effect: at least a box's, entered at its centre (two steps out)
        it.each([STRIKE, LOOP])("should draw and fade %s before the shortest effect ends", (selector) => {
            const timing = animationTimingOf(animationOf(selector), "paper-group-strike");
            const shortestEffect = 2 * GROUP_RIPPLE_STEP_MS + STYLE_MOMENTS.paper.groupEffectMs;

            expect((timing?.fixedDelayMs ?? 0) + (timing?.durationMs ?? 0)).toBeLessThanOrEqual(shortestEffect);
            expect(keyframeEnds("paper-group-strike").to.get("opacity")).toBe("0");
        });

        it("should stop the wash and the pencil under reduced motion", () => {
            for (const selector of [GROUP_CELL, STRIKE, LOOP]) {
                expect(reducedMotionDeclarationsOf(selector).get("animation"), selector).toBe("none");
            }
        });
    });

    describe("celebration", () => {
        it("should sweep a red-pen check over the board, left to right, and keep it under the dialog", () => {
            const check = declarationsOf(PAPER_CSS, CHECK);

            expect(check.get("background-color")).toBe("var(--paper-check-ink)");
            expect(check.get("mask")).toContain("data:image/svg+xml");
            expect(animationOf(DRAWING_CHECK)).toMatch(/^paper-circle-draw .* backwards$/);
            expect(keyframeEnds("paper-circle-draw").from.get("clip-path")).toBe("inset(0 100% 0 0)");
        });

        it("should land the card slightly tilted, then sink it as the stamp lands", () => {
            const card = animationOf(LANDING_CARD);
            const stamp = animationTimingOf(animationOf(STAMPING), "paper-stamp-thud");
            const sink = animationTimingOf(card, "paper-card-sink");

            expect(card).toMatch(/^paper-card-land [^,]* backwards,/);
            expect(keyframeEnds("paper-card-land").from.get("transform")).toContain("rotate(");
            expect(sink?.fixedDelayMs).toBeGreaterThan(stamp?.fixedDelayMs ?? Infinity);
        });

        it("should underline the title by hand once the card has landed", () => {
            const land = animationTimingOf(animationOf(LANDING_CARD), "paper-card-land");
            const underline = animationTimingOf(animationOf(DRAWING_UNDERLINE), "paper-circle-draw");

            expect(declarationsOf(PAPER_CSS, UNDERLINE).get("background-color")).toBe("var(--color-primary)");
            expect(underline?.fixedDelayMs).toBeGreaterThanOrEqual((land?.fixedDelayMs ?? 0) + (land?.durationMs ?? 0) - 100);
            expect(animationOf(DRAWING_UNDERLINE)).toMatch(/ backwards$/);
        });

        it("should stamp last, keeping the stamp and its ring hidden until then", () => {
            const underline = animationTimingOf(animationOf(DRAWING_UNDERLINE), "paper-circle-draw");
            const stamp = animationTimingOf(animationOf(STAMPING), "paper-stamp-thud");
            const splat = animationTimingOf(animationOf(SPREADING_SPLAT), "paper-stamp-splat");

            expect(stamp?.fixedDelayMs).toBeGreaterThan((underline?.fixedDelayMs ?? 0) + (underline?.durationMs ?? 0) - 200);
            expect(animationOf(STAMPING)).toMatch(/ both$/);
            expect(keyframeEnds("paper-stamp-thud").from.get("opacity")).toBe("0");
            expect(splat?.fixedDelayMs).toBeGreaterThan(stamp?.fixedDelayMs ?? Infinity);
            expect(declarationsOf(PAPER_CSS, SPLAT).get("opacity")).toBe("0");
        });

        it("should ink the stamp in the paper's red, worn by a mask", () => {
            const stamp = declarationsOf(PAPER_CSS, STAMP);

            expect(declarationsOf(PAPER_CSS, SCOPE).get("--paper-stamp-ink")).toMatch(/^color-mix\(in srgb, var\(--color-danger\) [\d.]+%, transparent\)$/);
            expect(stamp.get("color")).toBe("var(--paper-stamp-ink)");
            expect(stamp.get("border-color")).toBe("var(--paper-stamp-ink)");
            expect(stamp.get("mask-image")).toContain("var(--paper-stamp-wear)");
        });

        it("should show the still end state: the check, underline and stamp already there", () => {
            expect(declarationsOf(PAPER_CSS, CHECK).has("animation")).toBe(false);
            expect(declarationsOf(PAPER_CSS, UNDERLINE).has("animation")).toBe(false);
            expect(declarationsOf(PAPER_CSS, STAMP).has("animation")).toBe(false);
            expect(declarationsOf(PAPER_CSS, STAMP).has("opacity")).toBe(false);
            expect(declarationsOf(PAPER_CSS, CARD).has("animation")).toBe(false);
        });

        it("should stop every part of it under reduced motion", () => {
            for (const selector of [DRAWING_CHECK, LANDING_CARD, DRAWING_UNDERLINE, STAMPING, SPREADING_SPLAT]) {
                expect(reducedMotionDeclarationsOf(selector).get("animation"), selector).toBe("none");
            }
        });
    });

    describe("loader", () => {
        it.each([0, 1, 2, 3])("should draw grid line and write digit %i in turn on one 3.4s loop", (step) => {
            const line = animationOf(`${LOADER_LINE}:nth-child(${step + 1})`);
            const digit = animationOf(`${LOADER_DIGIT}:nth-of-type(${step + 1})`);

            expect(line).toMatch(new RegExp(`^paper-loader-line-${step} 3400ms .*infinite`));
            expect(digit).toMatch(new RegExp(`^paper-loader-digit-${step} 3400ms .*infinite`));
        });

        // Each round starts on a blank note, so the loop has no seam
        it.each(["line", "digit"])("should start and end each %s round wiped", (kind) => {
            for (const step of [0, 1, 2, 3]) {
                const { from, to } = keyframeEnds(`paper-loader-${kind}-${step}`);

                expect(from.get("opacity"), `${kind} ${step}`).toBe("0");
                expect(to.get("opacity"), `${kind} ${step}`).toBe("0");
            }
        });

        it("should show the note written under reduced motion", () => {
            for (const step of [1, 2, 3, 4]) {
                expect(reducedMotionDeclarationsOf(`${LOADER_LINE}:nth-child(${step})`).get("animation")).toBe("none");
                expect(reducedMotionDeclarationsOf(`${LOADER_DIGIT}:nth-of-type(${step})`).get("animation")).toBe("none");
            }
            expect(reducedMotionDeclarationsOf(LOADER_LINE).get("stroke-dashoffset")).toBe("0");
            expect(reducedMotionDeclarationsOf(LOADER_LINE).get("opacity")).toBe("1");
            expect(reducedMotionDeclarationsOf(LOADER_DIGIT).get("clip-path")).toBe("none");
            expect(reducedMotionDeclarationsOf(LOADER_DIGIT).get("opacity")).toBe("1");
        });
    });
});
