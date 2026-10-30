import postcss from "postcss";
import { ARRIVAL_SETTLE_MS } from "@/presentation/components/board-cell/useArrivalMotion";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import { animationTimingOf, declarationsOf, reducedMotionDeclarationsOf } from "../../styleSheetRules";
import { AURORA_CSS, AURORA_SCOPE } from "./auroraSheet";

const BOARD = `${AURORA_SCOPE} [data-skin~="board"]`;
const ARRIVING_DIGIT = `${BOARD} [data-variant] > .value-arrive`;
const PULSE = `${BOARD} [data-variant][data-arriving]::before`;
const GHOST = `${BOARD} [data-variant].value-leave::before`;

const collapse = (text: string): string => text.replace(/\s+/g, " ").trim();

// Each frame of a @keyframes block, by its collapsed selector
const framesOf = (name: string): Map<string, Map<string, string>> => {
    const frames = new Map<string, Map<string, string>>();
    postcss.parse(AURORA_CSS).walkAtRules("keyframes", (atRule) => {
        if (atRule.params !== name) return;
        atRule.walkRules((frame) => {
            const declarations = new Map<string, string>();
            frame.walkDecls((declaration) => {
                declarations.set(declaration.prop, collapse(declaration.value));
            });
            frames.set(collapse(frame.selector), declarations);
        });
    });
    return frames;
};

const animationOf = (selector: string): string => declarationsOf(AURORA_CSS, selector).get("animation") ?? "";

const propertiesOf = (name: string): string[] => [...framesOf(name).values()].flatMap(frame => [...frame.keys()]);

describe("aurora moments", () => {
    // From Aurora.dc's softA / pulseA / fadeA, without their blur (spec ruling 11) and with the pulse kept to the
    // cell and its gaps (spec ruling 9)
    describe("digit arrival", () => {
        // A pen masked by reference draws nothing in WebKit, so the arrival is the skin's alone
        it("should have no digit writer, so every engine shows the same arrival", () => {
            expect(STYLE_MOMENTS.aurora.digitWriter).toBeUndefined();
        });

        // The canvas's 550ms softA, run over the pulse's 800ms so the digit never settles the arrival before the pulse:
        // 330ms is 41.25% and 550ms 68.75% of 800ms, each segment keeping its length and easing
        it("should grow the digit in from 55% by 550ms, its own colour's 6px glow drawn in to nothing by 330ms, on an 800ms run", () => {
            const frames = framesOf("aurora-arrive");

            expect(animationTimingOf(animationOf(ARRIVING_DIGIT), "aurora-arrive")).toEqual({ durationMs: 800, fixedDelayMs: 0 });
            expect(frames.get("0%")).toEqual(new Map([
                ["opacity", "0"],
                ["transform", "scale(0.55)"],
                ["text-shadow", "0 0 6px currentColor"],
            ]));
            expect(frames.get("41.25%")).toEqual(new Map([["opacity", "1"], ["text-shadow", "0 0 0 currentColor"]]));
            expect(frames.get("68.75%, 100%")).toEqual(new Map([["transform", "scale(1)"]]));
        });

        // The digit's animationend settles the arrival too (BoardCell), so ending first would cut the pulse short
        it("should end the digit's arrival no earlier than the pulse", () => {
            const endOf = (selector: string, name: string): number => {
                const timing = animationTimingOf(animationOf(selector), name);
                return (timing?.durationMs ?? Number.NaN) + (timing?.fixedDelayMs ?? Number.NaN);
            };

            expect(endOf(ARRIVING_DIGIT, "aurora-arrive")).toBeGreaterThanOrEqual(endOf(PULSE, "aurora-pulse"));
        });

        it("should lay a soft disc of 55% of the primary over the cell and its gaps, under every digit, untouchable", () => {
            const pulse = declarationsOf(AURORA_CSS, PULSE);

            expect(pulse.get("content")).toBe('""');
            expect(pulse.get("position")).toBe("absolute");
            expect(pulse.get("inset")).toBe("-2px");
            expect(pulse.get("z-index")).toBe("0");
            expect(pulse.get("pointer-events")).toBe("none");
            expect(pulse.get("background-image")).toBe("radial-gradient(circle, color-mix(in srgb, var(--color-primary) 55%, transparent), transparent 70%)");
            // Unseen without its animation
            expect(pulse.get("opacity")).toBe("0");
        });

        // The pulse is the cell's ::before, whose animationend settles the arrival before the timer would
        it("should swell the pulse from 40% to 115% and fade it from 0.95 over 800ms ease-out, ending before the arrival settles on its own", () => {
            const animation = animationOf(PULSE);
            const timing = animationTimingOf(animation, "aurora-pulse");
            const frames = framesOf("aurora-pulse");

            expect(timing).toEqual({ durationMs: 800, fixedDelayMs: 0 });
            expect(animation).toContain(" ease-out");
            expect((timing?.durationMs ?? Number.NaN) + (timing?.fixedDelayMs ?? Number.NaN)).toBeLessThan(ARRIVAL_SETTLE_MS);
            expect(frames.get("0%")).toEqual(new Map([["opacity", "0.95"], ["transform", "scale(0.4)"]]));
            expect(frames.get("100%")).toEqual(new Map([["opacity", "0"], ["transform", "scale(1.15)"]]));
        });

        // The selected cell is the solid primary, which a primary pulse would vanish into: its pulse is on-primary, the
        // same disc and run otherwise, and its ring on the ::after never moves
        it("should pulse a selected cell in 55% of on-primary, by the same run, its ring left on the ::after", () => {
            const selectedPulse = declarationsOf(AURORA_CSS, `${BOARD} [data-variant="selected"][data-arriving]::before`);

            expect([...selectedPulse]).toEqual([
                ["background-image", "radial-gradient(circle, color-mix(in srgb, var(--color-on-primary) 55%, transparent), transparent 70%)"],
            ]);
            expect(declarationsOf(AURORA_CSS, `${BOARD} [data-variant="selected"]::after`).has("animation")).toBe(false);
        });
    });

    describe("erase", () => {
        // Only a player's digit can be erased, and those are the primary
        it("should draw the erased digit in the primary at the player's size, untouchable, unseen without its animation", () => {
            const ghost = declarationsOf(AURORA_CSS, GHOST);

            expect(ghost.get("content")).toBe('attr(data-leaving-value) / ""');
            expect(ghost.get("color")).toBe("var(--color-primary)");
            expect(ghost.get("font-size")).toBe("calc(22px * var(--entry-scale, 1))");
            expect(ghost.get("pointer-events")).toBe("none");
            expect(ghost.get("opacity")).toBe("0");
        });

        it("should shrink it to 60% and fade it over 500ms ease-in, ending before the cell settles on its own", () => {
            const animation = animationOf(GHOST);
            const timing = animationTimingOf(animation, "aurora-leave");
            const frames = framesOf("aurora-leave");

            expect(timing).toEqual({ durationMs: 500, fixedDelayMs: 0 });
            expect(animation).toContain(" ease-in");
            expect((timing?.durationMs ?? Number.NaN) + (timing?.fixedDelayMs ?? Number.NaN)).toBeLessThan(ARRIVAL_SETTLE_MS);
            expect(frames.get("0%")).toEqual(new Map([["opacity", "1"], ["transform", "none"]]));
            expect(frames.get("100%")).toEqual(new Map([["opacity", "0"], ["transform", "scale(0.6)"]]));
        });
    });

    describe("both", () => {
        // Neither pseudo-element keeps its last frame, so no glow or ghost stays on the board
        it("should leave nothing behind on either pseudo-element", () => {
            for (const selector of [PULSE, GHOST]) {
                expect(animationOf(selector), selector).not.toMatch(/forwards|both/);
                expect(declarationsOf(AURORA_CSS, selector).get("opacity"), selector).toBe("0");
            }
        });

        // Opacity and transform only, and the arriving digit's text-shadow: no filter, so every engine draws it alike
        it("should animate only opacity and transform, the arriving digit its text-shadow too, with no filter", () => {
            expect(propertiesOf("aurora-arrive").every(property => ["opacity", "transform", "text-shadow"].includes(property))).toBe(true);
            for (const name of ["aurora-pulse", "aurora-leave"]) {
                expect(propertiesOf(name).length, name).toBeGreaterThan(0);
                expect(propertiesOf(name).every(property => ["opacity", "transform"].includes(property)), name).toBe(true);
            }
            for (const selector of [ARRIVING_DIGIT, PULSE, GHOST]) {
                expect([...declarationsOf(AURORA_CSS, selector).keys()].some(property => /filter|mask/.test(property)), selector).toBe(false);
            }
        });

        // Reduced motion, like the motion setting turned off, leaves no arrival or erase: the digit simply comes and goes
        it("should stop under reduced motion, the digit shown and both pseudo-elements unseen", () => {
            for (const selector of [ARRIVING_DIGIT, PULSE, GHOST]) {
                expect(reducedMotionDeclarationsOf(AURORA_CSS, selector).get("animation"), selector).toBe("none");
            }
            expect(declarationsOf(AURORA_CSS, ARRIVING_DIGIT).has("opacity")).toBe(false);
        });
    });
});
