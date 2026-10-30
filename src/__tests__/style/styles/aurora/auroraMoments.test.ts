import postcss from "postcss";
import { ARRIVAL_SETTLE_MS } from "@/presentation/components/board-cell/useArrivalMotion";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import { GROUP_RIPPLE_STEP_MS } from "@/presentation/pages/game/useGroupEffect";
import { animationTimingOf, declarationsOf, reducedMotionDeclarationsOf } from "../../styleSheetRules";
import { AURORA_CSS, AURORA_DARK, AURORA_SCOPE } from "./auroraSheet";

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
    // GroupAurora: light ripples across the group's panes from the cell just filled, a streak of the aurora glides
    // along a completed line, and a completed box sends one ring out. Without the canvas's blur and the cells' glow
    // shadow (spec ruling 15): the streak's edges fade by a gradient mask instead. Only with motion allowed.
    describe("group completion", () => {
        const GROUP_CELL = `${BOARD} [data-group]:not(.animate-hint-reveal-glow)`;
        const RIBBON = `${AURORA_SCOPE} .aurora-group-ribbon`;
        const RIBBON_OF = { row: `${RIBBON}[data-kind="row"]`, column: `${RIBBON}[data-kind="column"]` };
        const RING = `${AURORA_SCOPE} .aurora-group-ring`;
        const GROUND = "var(--aurora-cell-ground)";
        const streakOf = (angle: string): string => `linear-gradient(${angle}, transparent, `
            + "color-mix(in srgb, var(--color-aurora-1) 70%, transparent) 30%, "
            + "color-mix(in srgb, var(--color-aurora-3) 70%, transparent) 50%, "
            + "color-mix(in srgb, var(--color-aurora-2) 70%, transparent) 70%, transparent)";

        const spanOf = (selector: string, name: string): { startMs: number; endMs: number } => {
            const timing = animationTimingOf(animationOf(selector), name);
            if (timing === null) throw new Error(`${selector} does not run ${name}`);
            return { startMs: timing.fixedDelayMs, endMs: timing.fixedDelayMs + timing.durationMs };
        };

        // Every rule outside @keyframes and reduced motion that names a group piece, with its declarations
        const groupRules = (): { selector: string; declarations: Map<string, string> }[] => {
            const rules: { selector: string; declarations: Map<string, string> }[] = [];
            postcss.parse(AURORA_CSS).walkRules((rule) => {
                if (rule.parent?.type === "atrule") return;
                const declarations = new Map<string, string>();
                rule.walkDecls((declaration) => { declarations.set(declaration.prop, collapse(declaration.value)); });
                for (const selector of rule.selectors.map(collapse).filter(item => /\[data-group\]|aurora-group/.test(item))) {
                    rules.push({ selector, declarations });
                }
            });
            return rules;
        };

        // Review Focus 1: the glow starts and ends on the cell's own ground, so a selected or error cell never flashes
        // back to plain glass
        it("should light each cell of the group with 30% of the primary from its own ground and back, with no shadow", () => {
            const frames = framesOf("aurora-group-glow");

            expect(frames.get("0%")).toEqual(new Map([["background-color", GROUND]]));
            expect(frames.get("35%")).toEqual(new Map([["background-color", `color-mix(in srgb, var(--color-primary) 30%, ${GROUND})`]]));
            expect(frames.get("100%")).toEqual(new Map([["background-color", GROUND]]));
            expect(propertiesOf("aurora-group-glow").every(property => property === "background-color")).toBe(true);
        });

        it("should ripple the glow out from the entered cell 45ms a step, each cell's 600ms from 100ms past its delay", () => {
            const step = declarationsOf(AURORA_CSS, GROUP_CELL).get("--group-ripple-step") ?? "";

            expect(step).toBe("45ms");
            expect(Number.parseFloat(step)).toBeLessThanOrEqual(GROUP_RIPPLE_STEP_MS);
            expect(spanOf(GROUP_CELL, "aurora-group-glow")).toEqual({ startMs: 100, endMs: 700 });
            expect(animationOf(GROUP_CELL)).toContain("calc(100ms + var(--group-delay))");
        });

        // CLAUDE.md's trap: the entered cell lies in its own group and arrives at once. The glow is the cell's own
        // background, so its digit's arrival (> .value-arrive) and its pulse (::before) run on untouched.
        it("should leave the entered digit's arrival and the cell's pulse to their own animations", () => {
            const animated = groupRules().filter(({ declarations }) => declarations.has("animation"));

            expect(animated.map(({ selector }) => selector)).toContain(GROUP_CELL);
            for (const { selector } of animated) {
                expect(selector, selector).not.toMatch(/> div|::before|::after|value-arrive/);
            }
            expect(animationOf(ARRIVING_DIGIT)).toMatch(/^aurora-arrive /);
            expect(animationOf(PULSE)).toMatch(/^aurora-pulse /);
        });

        it("should lay a streak of aurora-1, aurora-3 and aurora-2 along a row, never the primary a player's digit is written in, its top and bottom faded by a gradient mask", () => {
            const row = declarationsOf(AURORA_CSS, RIBBON_OF.row);

            expect(row.get("background-image")).toBe(streakOf("90deg"));
            expect(row.get("mask-image")).toMatch(/^linear-gradient\(180deg, transparent, /);
            expect(row.get("-webkit-mask-image")).toBe(row.get("mask-image"));
        });

        it("should lay the same streak down a column, its sides faded", () => {
            const column = declarationsOf(AURORA_CSS, RIBBON_OF.column);

            expect(column.get("background-image")).toBe(streakOf("180deg"));
            expect(column.get("mask-image")).toMatch(/^linear-gradient\(90deg, transparent, /);
            expect(column.get("-webkit-mask-image")).toBe(column.get("mask-image"));
        });

        it("should sweep a row's streak out along it from 100ms over 760ms, a column's down it", () => {
            expect(spanOf(RIBBON_OF.row, "aurora-group-sweep-x")).toEqual({ startMs: 100, endMs: 860 });
            expect(spanOf(RIBBON_OF.column, "aurora-group-sweep-y")).toEqual({ startMs: 100, endMs: 860 });
            for (const [name, axis] of [["aurora-group-sweep-x", "X"], ["aurora-group-sweep-y", "Y"]] as const) {
                const frames = framesOf(name);
                expect(frames.get("0%"), name).toEqual(new Map([["opacity", "0"], ["transform", `scale${axis}(0.1)`]]));
                expect(frames.get("35%"), name).toEqual(new Map([["opacity", "0.9"]]));
                expect(frames.get("100%"), name).toEqual(new Map([["opacity", "0"], ["transform", `scale${axis}(1.1)`]]));
            }
        });

        it("should ring a box in 2px of 80% of the primary under a still soft light of aurora-1, sent out from 120ms over 760ms", () => {
            const ring = declarationsOf(AURORA_CSS, RING);
            const frames = framesOf("aurora-group-ring");

            expect(ring.get("box-shadow")).toBe("inset 0 0 0 2px color-mix(in srgb, var(--color-primary) 80%, transparent), "
                + "0 0 24px color-mix(in srgb, var(--color-aurora-1) 60%, transparent)");
            expect(spanOf(RING, "aurora-group-ring")).toEqual({ startMs: 120, endMs: 880 });
            expect(frames.get("0%")).toEqual(new Map([["opacity", "0.9"], ["transform", "scale(0.35)"]]));
            expect(frames.get("100%")).toEqual(new Map([["opacity", "0"], ["transform", "scale(1.12)"]]));
        });

        it("should move the streaks and the ring by transform and opacity alone, with no filter", () => {
            for (const name of ["aurora-group-sweep-x", "aurora-group-sweep-y", "aurora-group-ring"]) {
                expect([...new Set(propertiesOf(name))].sort(), name).toEqual(["opacity", "transform"]);
            }
            for (const { selector, declarations } of groupRules()) {
                expect([...declarations.keys()].some(property => /filter|offset-/.test(property)), selector).toBe(false);
            }
        });

        // Review Focus 3: 晨光 over the glass, under every digit (2) and the selected and answer cells (1)
        it("should lay the streaks and the ring at 0, unseen without their animations", () => {
            for (const selector of [RIBBON, RING]) {
                const piece = declarationsOf(AURORA_CSS, selector);
                expect(piece.get("z-index"), selector).toBe("0");
                expect(piece.get("opacity"), selector).toBe("0");
            }
        });

        // 夜空's light is bright under light digits, so it passes under every cell's glass (88%), lighting the gaps; the
        // grid's own stacking context keeps it over the page and its lights
        it("should lay 夜空's streaks and ring under the cells' glass, inside the grid's own stacking context", () => {
            for (const piece of [".aurora-group-ribbon", ".aurora-group-ring"]) {
                expect(declarationsOf(AURORA_CSS, `${AURORA_DARK} ${piece}`).get("z-index"), piece).toBe("-1");
            }
            expect(declarationsOf(AURORA_CSS, `${AURORA_SCOPE} [data-skin~="board-grid"]`).get("isolation")).toBe("isolate");
        });

        it("should end each piece within the group effect", () => {
            const effectMs = STYLE_MOMENTS.aurora.groupEffectMs;

            expect(effectMs).toBe(900);
            expect(spanOf(GROUP_CELL, "aurora-group-glow").endMs).toBeLessThanOrEqual(effectMs);
            expect(spanOf(RIBBON_OF.row, "aurora-group-sweep-x").endMs).toBeLessThanOrEqual(effectMs);
            expect(spanOf(RIBBON_OF.column, "aurora-group-sweep-y").endMs).toBeLessThanOrEqual(effectMs);
            expect(spanOf(RING, "aurora-group-ring").endMs).toBeLessThanOrEqual(effectMs);
            // A box completed alone from its centre: its farthest cell is two steps out
            expect(spanOf(RING, "aurora-group-ring").endMs).toBeLessThanOrEqual(effectMs + 2 * GROUP_RIPPLE_STEP_MS);
        });

        it("should stop every piece under reduced motion and leave no still cue", () => {
            const animated = groupRules().filter(({ declarations }) => declarations.has("animation"));

            expect(animated.map(({ selector }) => selector).sort()).toEqual([GROUP_CELL, RING, ...Object.values(RIBBON_OF)].sort());
            for (const { selector } of animated) {
                const stopped = reducedMotionDeclarationsOf(AURORA_CSS, selector);
                expect(stopped.get("animation"), selector).toBe("none");
                expect([...stopped.keys()], selector).toEqual(["animation"]);
            }
        });
    });
    // From MomentsAurora.dc's .halo / .lights, without the halo's blur and its conic-gradient (spec ruling 12): four
    // soft lights in a ring turn instead. Only the halo's transform, the lights' transform and the pseudo-elements'
    // opacity move (plan ruling 10).
    describe("loader", () => {
        const LOADER = `${AURORA_SCOPE} .aurora-loader`;
        const HALO = `${LOADER}-halo`;
        const DOT = `${LOADER}-dot`;
        const BRIGHT = `${DOT}::before`;
        const GLOW = `${DOT}::after`;
        const RINGS = ["centre", "edge", "corner"] as const;
        const DELAYS = { centre: "0s", edge: "0.28s", corner: "0.56s" };

        it("should turn a 150px halo of the four aurora lights in a ring, at 55% opacity, once in 7s", () => {
            const halo = declarationsOf(AURORA_CSS, HALO);
            const lights = halo.get("background-image") ?? "";

            expect(lights.match(/radial-gradient\(/g)).toHaveLength(4);
            for (const light of ["aurora-1", "aurora-2", "aurora-3", "aurora-4"]) {
                expect(lights, light).toContain(`var(--color-${light})`);
            }
            expect(lights).not.toContain("conic-gradient");
            expect(halo.get("opacity")).toBe("0.55");
            expect(animationTimingOf(halo.get("animation") ?? "", "aurora-loader-spin")).toEqual({ durationMs: 7000, fixedDelayMs: 0 });
            expect(halo.get("animation")).toContain("linear infinite");
            expect([...framesOf("aurora-loader-spin")]).toEqual([["100%", new Map([["transform", "rotate(360deg)"]])]]);
        });

        it("should breathe each light in 2.4s, the centre first, then the edges, then the corners", () => {
            expect(animationTimingOf(animationOf(DOT), "aurora-loader-breathe")).toEqual({ durationMs: 2400, fixedDelayMs: 0 });
            expect(animationOf(DOT)).toContain("infinite");
            for (const ring of RINGS) {
                expect(declarationsOf(AURORA_CSS, `${DOT}[data-ring="${ring}"]`).get("--aurora-loader-delay"), ring).toBe(DELAYS[ring]);
            }
            expect(animationOf(DOT)).toContain("var(--aurora-loader-delay)");
        });

        it("should scale the light from 0.7 up to 1.2 at 30% and to 1 at 60%, back to 0.7, and nothing else", () => {
            const frames = framesOf("aurora-loader-breathe");

            expect(frames.get("0%, 100%")).toEqual(new Map([["transform", "scale(0.7)"]]));
            expect(frames.get("30%")).toEqual(new Map([["transform", "scale(1.2)"]]));
            expect(frames.get("60%")).toEqual(new Map([["transform", "scale(1)"]]));
            expect(propertiesOf("aurora-loader-breathe").every(property => property === "transform")).toBe(true);
        });

        // The bright colour and the glow are drawn once and only faded, so no colour or shadow is repainted
        it("should light the primary on the ::before and its soft glow on the ::after, each only fading in step with the breath", () => {
            const frames = framesOf("aurora-loader-glow");

            expect(declarationsOf(AURORA_CSS, BRIGHT).get("background-color")).toBe("var(--color-primary)");
            expect(declarationsOf(AURORA_CSS, GLOW).get("background-image")).toBe(
                "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 70%, transparent) 0, transparent 70%)",
            );
            for (const selector of [BRIGHT, GLOW]) {
                expect(animationTimingOf(animationOf(selector), "aurora-loader-glow"), selector).toEqual({ durationMs: 2400, fixedDelayMs: 0 });
                expect(animationOf(selector), selector).toContain("var(--aurora-loader-delay)");
                expect(declarationsOf(AURORA_CSS, selector).get("opacity"), selector).toBe("0");
            }
            expect(propertiesOf("aurora-loader-glow").every(property => property === "opacity")).toBe(true);
            // Every round starts dark and ends dark
            expect(frames.get("0%")).toEqual(new Map([["opacity", "0"]]));
            expect(frames.get("30%")).toEqual(new Map([["opacity", "1"]]));
            expect(frames.get("100%")).toEqual(new Map([["opacity", "0"]]));
        });

        it("should use no filter and no mask anywhere in the loader", () => {
            for (const selector of [HALO, DOT, BRIGHT, GLOW]) {
                expect([...declarationsOf(AURORA_CSS, selector).keys()].some(property => /filter|mask/.test(property)), selector).toBe(false);
            }
        });

        it("should hold still under reduced motion, only the centre light lit", () => {
            for (const selector of [HALO, DOT, BRIGHT, GLOW]) {
                expect(reducedMotionDeclarationsOf(AURORA_CSS, selector).get("animation"), selector).toBe("none");
            }
            for (const selector of [`${DOT}[data-ring="centre"]::before`, `${DOT}[data-ring="centre"]::after`]) {
                expect(reducedMotionDeclarationsOf(AURORA_CSS, selector).get("opacity"), selector).toBe("1");
            }
            for (const selector of [`${DOT}:not([data-ring="centre"])::before`, `${DOT}:not([data-ring="centre"])::after`]) {
                expect(reducedMotionDeclarationsOf(AURORA_CSS, selector).get("opacity"), selector).toBe("0");
            }
        });

        // Loading follows the system's reduced motion alone
        it("should not look at the motion setting", () => {
            const loaderSelectors: string[] = [];
            postcss.parse(AURORA_CSS).walkRules((rule) => {
                loaderSelectors.push(...rule.selectors.filter(selector => selector.includes("aurora-loader")));
            });

            expect(loaderSelectors.length).toBeGreaterThan(0);
            expect(loaderSelectors.some(selector => /data-(?:motion|still)|\.no-motion/.test(selector))).toBe(false);
        });
    });

    // From MomentsAurora.dc's .surge / au-glow / .ring / .mote / au-frost, without any blur (spec rulings 11, 18–20):
    // the lights surge behind the solved board, the panes glow ring by ring from the centre, and behind the card rings
    // go out and sparks rise (AuroraCelebration)
    describe("celebration", () => {
        const CELEBRATING = `${BOARD}:is([data-celebration="playing"], [data-celebration="done"])`;
        const STILL_BOARD = `${BOARD}[data-celebration="still"]`;
        const SURGE = `${BOARD}[data-celebration]::before`;
        const GLOWING_CELL = `${CELEBRATING} [data-variant]`;
        const GROUP_CELL = `${BOARD} [data-group]:not(.animate-hint-reveal-glow)`;
        const CARD = `${AURORA_SCOPE} [data-skin~="card"][data-skin~="celebration"]:not([data-still])`;
        const TROPHY = `${AURORA_SCOPE} [data-skin~="trophy"]`;
        const SCENE = `${AURORA_SCOPE} .aurora-celebration`;
        const RING = `${SCENE}-ring`;
        const MOVING_RING = `${SCENE}:not([data-still]) .aurora-celebration-ring`;
        const STILL_RING = `${SCENE}[data-still] .aurora-celebration-ring`;
        const SPARK = `${SCENE}-spark`;
        const GROUND = "var(--aurora-cell-ground)";
        const DISTANCE = "max(var(--cell-row) - 4, 4 - var(--cell-row), var(--cell-column) - 4, 4 - var(--cell-column))";

        // The top-level rules in source order, by their collapsed selectors
        const ruleOrder = (): string[][] => {
            const order: string[][] = [];
            postcss.parse(AURORA_CSS).walkRules((rule) => {
                if (rule.parent?.type === "atrule") return;
                order.push(rule.selectors.map(collapse));
            });
            return order;
        };
        const indexOfRule = (selector: string): number => ruleOrder().findIndex(selectors => selectors.includes(selector));

        // Attributes, classes and pseudo-classes: an :is() counts as its first argument (all of these weigh the same),
        // a :not() as its argument
        const weightOf = (selector: string): number => selector
            .replace(/:is\(([^,()]*)(?:,[^()]*)?\)/g, "$1")
            .replace(/:not\(([^()]*)\)/g, "$1")
            .match(/\[[^\]]*\]|\.[\w-]+|(?<!:):[\w-]+/g)?.length ?? 0;

        it("should lift the solved board into a stacking context of its own, so the surge lies behind its glass", () => {
            const board = declarationsOf(AURORA_CSS, `${BOARD}[data-celebration]`);

            expect(board.get("position")).toBe("relative");
            expect(board.get("isolation")).toBe("isolate");
        });

        it("should surge three lights of aurora-1, aurora-2 and aurora-4 out to 135% of the board, behind its glass, with no filter", () => {
            const surge = declarationsOf(AURORA_CSS, SURGE);
            const lights = surge.get("background-image") ?? "";

            expect(surge.get("content")).toBe('""');
            expect(surge.get("position")).toBe("absolute");
            expect(surge.get("inset")).toBe("-17.5%");
            expect(surge.get("z-index")).toBe("-1");
            expect(surge.get("pointer-events")).toBe("none");
            expect(surge.get("opacity")).toBe("0");
            expect(lights.match(/radial-gradient\(/g)).toHaveLength(3);
            // Each fades out within the box, so its edge never cuts a light off (the canvas blurred that away)
            expect(lights.match(/radial-gradient\(circle closest-side at /g)).toHaveLength(3);
            for (const light of ["aurora-1", "aurora-2", "aurora-4"]) {
                expect(lights, light).toContain(`var(--color-${light})`);
            }
            for (const selector of [SURGE, `${CELEBRATING}::before`, `${STILL_BOARD}::before`]) {
                expect([...declarationsOf(AURORA_CSS, selector).keys()].some(property => property.includes("filter")), selector).toBe(false);
            }
        });

        // Review Focus 4: past the board's sides the surge would let the page scroll sideways on a narrow screen
        it("should keep the page from scrolling sideways when the surge runs past the screen's sides", () => {
            expect(declarationsOf(AURORA_CSS, `${AURORA_SCOPE} [data-skin~="page-scroller"]`).get("overflow-x")).toBe("hidden");
        });

        it("should swell the surge from 60% and nothing to 0.9 at 40% and to 110% at 0.4, over 1.8s from the start", () => {
            const frames = framesOf("aurora-surge");

            expect(animationTimingOf(animationOf(`${CELEBRATING}::before`), "aurora-surge")).toEqual({ durationMs: 1800, fixedDelayMs: 0 });
            expect(animationOf(`${CELEBRATING}::before`)).toContain(" both");
            expect(frames.get("0%")).toEqual(new Map([["opacity", "0"], ["transform", "scale(0.6)"]]));
            expect(frames.get("40%")).toEqual(new Map([["opacity", "0.9"]]));
            expect(frames.get("100%")).toEqual(new Map([["opacity", "0.4"], ["transform", "scale(1.1)"]]));
        });

        // Spec ruling 19: ring by ring from the centre cell, 85ms a ring, by max() alone; the farthest ends at 1240ms
        it("should glow each pane with 30% of the primary from its own ground and back over 900ms, 85ms a ring from the centre", () => {
            const animation = animationOf(GLOWING_CELL);
            const frames = framesOf("aurora-celebration-glow");

            // The delay is all ring steps, no fixed part (the helper would read its 85ms step as one)
            expect(animationTimingOf(animation, "aurora-celebration-glow")?.durationMs).toBe(900);
            expect(animation).toContain(`calc(${DISTANCE} * 85ms)`);
            expect(animation).not.toMatch(/abs\(|mod\(/);
            expect(frames.get("0%")).toEqual(new Map([["background-color", GROUND]]));
            expect(frames.get("30%")).toEqual(new Map([["background-color", `color-mix(in srgb, var(--color-primary) 30%, ${GROUND})`]]));
            expect(frames.get("100%")).toEqual(new Map([["background-color", GROUND]]));
            expect(propertiesOf("aurora-celebration-glow").every(property => property === "background-color")).toBe(true);
        });

        // Plan ruling 8, Review Focus 2: the last digit may complete a group as it solves the board; only the
        // celebration's glow plays on the cells then
        it("should come after the group glow and weigh no less, so a group completed by the solving digit glows only once", () => {
            expect(indexOfRule(GROUP_CELL)).toBeGreaterThanOrEqual(0);
            expect(indexOfRule(GLOWING_CELL)).toBeGreaterThan(indexOfRule(GROUP_CELL));
            expect(weightOf(GLOWING_CELL)).toBeGreaterThanOrEqual(weightOf(GROUP_CELL));
        });

        // The glow is the cell's own background: the entered cell's pulse (::before) and its digit's arrival run on
        it("should leave the arriving digit and the pulse to their own rules", () => {
            const celebrationSelectors = ruleOrder().flat().filter(selector => selector.includes("data-celebration"));

            expect(celebrationSelectors.some(selector => /\[data-variant\][^ ]*(?:::before|::after| > )/.test(selector))).toBe(false);
            expect(animationOf(`${BOARD} [data-variant] > .value-arrive`)).toContain("aurora-arrive");
            expect(animationOf(`${BOARD} [data-variant][data-arriving]::before`)).toContain("aurora-pulse");
        });

        it("should focus the card in from 104% and nothing over 640ms from 100ms, with no blur", () => {
            const frames = framesOf("aurora-card-focus");

            expect(animationTimingOf(animationOf(CARD), "aurora-card-focus")).toEqual({ durationMs: 640, fixedDelayMs: 100 });
            expect(frames.get("0%")).toEqual(new Map([["opacity", "0"], ["transform", "scale(1.04)"]]));
            expect(frames.get("100%")).toEqual(new Map([["opacity", "1"], ["transform", "none"]]));
        });

        it("should set the trophy in the solid primary, its cup in on-primary, under a still 40px glow", () => {
            const trophy = declarationsOf(AURORA_CSS, TROPHY);

            expect(trophy.get("background-color")).toBe("var(--color-primary)");
            expect(trophy.get("box-shadow")).toBe("0 0 40px color-mix(in srgb, var(--color-primary) 60%, transparent)");
            expect(trophy.has("animation")).toBe(false);
            expect(declarationsOf(AURORA_CSS, `${TROPHY} > svg`).get("color")).toBe("var(--color-on-primary)");
        });

        it("should send each ring out from 60% to 260% and fade it every 2.4s, 0.1s, 0.9s and 1.7s in, under a still glow of aurora-1", () => {
            const ring = declarationsOf(AURORA_CSS, RING);
            const frames = framesOf("aurora-celebration-ring");

            expect(ring.get("box-shadow")).toBe("0 0 30px color-mix(in srgb, var(--color-aurora-1) 50%, transparent)");
            expect(ring.get("opacity")).toBe("0");
            expect(animationTimingOf(animationOf(MOVING_RING), "aurora-celebration-ring")?.durationMs).toBe(2400);
            expect(animationOf(MOVING_RING)).toContain("infinite");
            expect(animationOf(MOVING_RING)).toContain("var(--aurora-ring-delay)");
            expect(["0", "1", "2"].map(index => declarationsOf(AURORA_CSS, `${RING}[data-index="${index}"]`).get("--aurora-ring-delay")))
                .toEqual(["0.1s", "0.9s", "1.7s"]);
            expect(frames.get("0%")).toEqual(new Map([["opacity", "0.9"], ["transform", "scale(0.6)"]]));
            expect(frames.get("100%")).toEqual(new Map([["opacity", "0"], ["transform", "scale(2.6)"]]));
        });

        it("should draw each ring in 70% of its light", () => {
            for (const light of ["primary", "aurora-2", "aurora-1"]) {
                expect(declarationsOf(AURORA_CSS, `${RING}[data-light="${light}"]`).get("border-color"), light)
                    .toBe(`color-mix(in srgb, var(--color-${light}) 70%, transparent)`);
            }
        });

        it("should float each spark up 640px over 5.5s, moving only its transform and opacity", () => {
            const frames = framesOf("aurora-celebration-rise");

            expect(animationTimingOf(animationOf(SPARK), "aurora-celebration-rise")?.durationMs).toBe(5500);
            expect(animationOf(SPARK)).toContain("linear");
            expect(animationOf(SPARK)).toContain("var(--aurora-spark-delay)");
            expect(animationOf(SPARK)).toContain("infinite");
            expect(declarationsOf(AURORA_CSS, SPARK).get("opacity")).toBe("0");
            for (const light of ["aurora-1", "aurora-2"]) {
                expect(declarationsOf(AURORA_CSS, `${SPARK}[data-light="${light}"]`).get("background-color"), light).toBe(`var(--color-${light})`);
            }
            expect(frames.get("0%")).toEqual(new Map([["opacity", "0"], ["transform", "translateY(0)"]]));
            expect(frames.get("15%")).toEqual(new Map([["opacity", "0.9"]]));
            expect(frames.get("100%")).toEqual(new Map([["opacity", "0"], ["transform", "translate(24px, -640px)"]]));
        });

        it("should move the surge, rings, sparks and card by transform and opacity alone", () => {
            for (const name of ["aurora-surge", "aurora-celebration-ring", "aurora-celebration-rise", "aurora-card-focus"]) {
                expect([...new Set(propertiesOf(name))].sort(), name).toEqual(["opacity", "transform"]);
            }
        });

        // Spec's still celebration and plan ruling 9
        it("should hold the surge at 110% and 0.4 when still", () => {
            const surge = declarationsOf(AURORA_CSS, `${STILL_BOARD}::before`);

            expect(surge.get("opacity")).toBe("0.4");
            expect(surge.get("transform")).toBe("scale(1.1)");
            expect(surge.has("animation")).toBe(false);
        });

        it("should leave a soft still light of the primary on the centre box when still: 22% at the centre, 11% round it", () => {
            const cell = declarationsOf(AURORA_CSS, `${STILL_BOARD} [data-variant]`);

            expect(cell.get("background-color")).toBe(`color-mix(in srgb, var(--color-primary) max(0%, 22% - 11% * ${DISTANCE}), ${GROUND})`);
            expect(cell.has("animation")).toBe(false);
        });

        it("should hold one ring at 150% and 0.6 when still", () => {
            const ring = declarationsOf(AURORA_CSS, STILL_RING);

            expect(ring.get("opacity")).toBe("0.6");
            expect(ring.get("transform")).toBe("scale(1.5)");
        });

        it("should stop every part under reduced motion", () => {
            for (const selector of [`${CELEBRATING}::before`, GLOWING_CELL, CARD, MOVING_RING, SPARK]) {
                expect(reducedMotionDeclarationsOf(AURORA_CSS, selector).get("animation"), selector).toBe("none");
            }
        });

        it("should open the dialog 800ms in, while the outer panes are still glowing", () => {
            expect(STYLE_MOMENTS.aurora.celebrationBoardMs).toBe(800);
        });
    });
});
