import { readFileSync } from "fs";
import postcss from "postcss";
import { ARRIVAL_SETTLE_MS } from "@/presentation/components/board-cell/useArrivalMotion";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import { GROUP_RIPPLE_STEP_MS } from "@/presentation/pages/game/useGroupEffect";
import { animationTimingOf, declarationsOf, reducedMotionDeclarationsOf } from "../../styleSheetRules";

const BLUEPRINT_CSS = readFileSync("src/style/styles/blueprint/skin.css", "utf8");

const SCOPE = '[data-style="blueprint"]';
const BOARD = `${SCOPE} [data-skin~="board"]`;
const ARRIVING_DIGIT = `${BOARD} [data-variant] > .value-arrive`;
const CROSSHAIRS = `${BOARD} [data-variant][data-arriving]::before`;

const LOADER_PLOT = `${SCOPE} .blueprint-loader-plot`;
const LOADER_PEN = `${SCOPE} .blueprint-loader-pen`;
const LOADER_DIMENSION = `${SCOPE} .blueprint-loader-dimension`;
const LOADER_READINGS = `${SCOPE} .blueprint-loader-coordinates > span`;
const PEN_SUPPORT = 'offset-path: path("M0 0")';

const collapse = (text: string): string => text.replace(/\s+/g, " ").trim();

// Each frame of a @keyframes block, by its collapsed selector
const framesOf = (name: string): Map<string, Map<string, string>> => {
    const frames = new Map<string, Map<string, string>>();
    postcss.parse(BLUEPRINT_CSS).walkAtRules("keyframes", (atRule) => {
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

interface LoaderAnimation { selector: string; animation: string; name: string; supports: string | null }

// Every animated loader rule outside @keyframes and reduced motion, with the @supports it sits in, if any
const loaderAnimations = (): LoaderAnimation[] => {
    const animations: LoaderAnimation[] = [];
    postcss.parse(BLUEPRINT_CSS).walkRules((rule) => {
        const parent = rule.parent?.type === "atrule" ? rule.parent as postcss.AtRule : null;
        if (parent !== null && ["keyframes", "media"].includes(parent.name)) return;
        rule.walkDecls("animation", (declaration) => {
            for (const selector of rule.selectors.map(collapse).filter(item => item.includes(".blueprint-loader"))) {
                const animation = collapse(declaration.value);
                animations.push({ selector, animation, name: animation.split(" ")[0] ?? "", supports: parent === null ? null : collapse(parent.params) });
            }
        });
    });
    return animations;
};

const loaderAnimationOf = (selector: string): LoaderAnimation | undefined =>
    loaderAnimations().find(animation => animation.selector === selector);

// The declarations of the rules listing a selector inside an @supports block with these conditions
const supportedDeclarationsOf = (selector: string, conditions: string): Map<string, string> => {
    const declarations = new Map<string, string>();
    postcss.parse(BLUEPRINT_CSS).walkAtRules("supports", (atRule) => {
        if (collapse(atRule.params) !== `(${conditions})`) return;
        atRule.walkRules((rule) => {
            if (!rule.selectors.map(collapse).includes(selector)) return;
            rule.walkDecls((declaration) => { declarations.set(declaration.prop, collapse(declaration.value)); });
        });
    });
    return declarations;
};

describe("blueprint moments", () => {
    describe("loader", () => {
        const LOADER_PIECES = [LOADER_PLOT, LOADER_PEN, LOADER_DIMENSION, LOADER_READINGS];
        const frameOf = (selector: string, offset: string): Map<string, string> | undefined =>
            framesOf(loaderAnimationOf(selector)?.name ?? "").get(offset);

        it("should run every piece on one 3.8s infinite loop", () => {
            for (const piece of LOADER_PIECES) {
                expect(loaderAnimationOf(piece), piece).toBeDefined();
            }
            for (const { selector, animation, name } of loaderAnimations()) {
                expect(animationTimingOf(animation, name)?.durationMs, selector).toBe(3800);
                expect(animation, selector).toContain(" infinite");
            }
        });

        // The line is dashed on and the pen moved along one path at the same steady pace
        it("should plot the line and move the pen linearly together, the readout ticking in six steps", () => {
            expect(loaderAnimationOf(LOADER_PLOT)?.animation).toContain(" linear ");
            expect(loaderAnimationOf(LOADER_PEN)?.animation).toContain(" linear ");
            expect(loaderAnimationOf(LOADER_DIMENSION)?.animation).toContain(" linear ");
            expect(loaderAnimationOf(LOADER_READINGS)?.animation).toContain(" steps(6, end) ");
            expect(frameOf(LOADER_READINGS, "0%")?.get("transform")).toBe("translateY(0)");
            // Six pairs of 14px readings
            expect(frameOf(LOADER_READINGS, "100%")?.get("transform")).toBe("translateY(-168px)");
        });

        it("should start every drawn piece hidden and end it hidden, so the loop has no seam", () => {
            const plot = declarationsOf(BLUEPRINT_CSS, LOADER_PLOT);

            expect(plot.get("stroke-dasharray")).toBe("1");
            expect(plot.get("stroke-dashoffset")).toBe("1");
            expect(frameOf(LOADER_PLOT, "0%")?.get("stroke-dashoffset")).toBe("1");
            expect(frameOf(LOADER_PLOT, "96%, 100%")?.get("opacity")).toBe("0");
            expect(frameOf(LOADER_PEN, "0%")?.get("opacity")).toBe("0");
            expect(frameOf(LOADER_PEN, "72%, 100%")?.get("opacity")).toBe("0");
            expect(frameOf(LOADER_DIMENSION, "0%, 68%")?.get("opacity")).toBe("0");
            expect(frameOf(LOADER_DIMENSION, "96%, 100%")?.get("opacity")).toBe("0");
            expect(declarationsOf(BLUEPRINT_CSS, LOADER_DIMENSION).get("opacity")).toBe("0");
        });

        it("should plot from 0 to 68%, then spread the dimension from its middle by 76%, hold to 86% and fade by 96%", () => {
            expect(frameOf(LOADER_PLOT, "68%")?.get("stroke-dashoffset")).toBe("0");
            expect(frameOf(LOADER_PLOT, "86%")).toEqual(new Map([["stroke-dashoffset", "0"], ["opacity", "1"]]));
            expect(frameOf(LOADER_PEN, "68%")?.get("offset-distance")).toBe("100%");
            expect(frameOf(LOADER_DIMENSION, "0%, 68%")?.get("clip-path")).toBe("inset(-8px 50% -8px 50%)");
            expect(frameOf(LOADER_DIMENSION, "76%, 86%")).toEqual(new Map([["opacity", "1"], ["clip-path", "inset(-8px 0 -8px 0)"]]));
        });

        it("should animate only opacity, transform, the dash offset, the pen's distance and the clip", () => {
            const allowed = ["opacity", "transform", "stroke-dashoffset", "offset-distance", "clip-path"];

            expect(loaderAnimations().length).toBeGreaterThan(0);
            for (const { name } of loaderAnimations()) {
                const properties = [...framesOf(name).values()].flatMap(frame => [...frame.keys()]);
                expect(properties.every(property => allowed.includes(property)), name).toBe(true);
            }
        });

        // Android WebView before Chrome 116 has no offset-path: there the line is plotted without a pen
        it("should move the pen only where offset-path is supported, along the plot's path", () => {
            const pen = supportedDeclarationsOf(LOADER_PEN, PEN_SUPPORT);

            expect(loaderAnimationOf(LOADER_PEN)?.supports).toBe(`(${PEN_SUPPORT})`);
            expect(pen.get("offset-path")).toBe("var(--blueprint-loader-path)");
            expect(pen.get("offset-rotate")).toBe("0deg");
            expect(pen.get("visibility")).toBe("visible");
            expect(declarationsOf(BLUEPRINT_CSS, LOADER_PEN).get("visibility")).toBe("hidden");
            expect(declarationsOf(BLUEPRINT_CSS, LOADER_PEN).has("animation")).toBe(false);
        });

        it("should stop under reduced motion on the plotted box, its dimension and still readings, without the pen", () => {
            for (const { selector } of loaderAnimations()) {
                expect(reducedMotionDeclarationsOf(BLUEPRINT_CSS, selector).get("animation"), selector).toBe("none");
            }
            expect(reducedMotionDeclarationsOf(BLUEPRINT_CSS, LOADER_PLOT).get("stroke-dashoffset")).toBe("0");
            expect(reducedMotionDeclarationsOf(BLUEPRINT_CSS, LOADER_DIMENSION).get("opacity")).toBe("1");
            expect(reducedMotionDeclarationsOf(BLUEPRINT_CSS, LOADER_DIMENSION).get("clip-path")).toBe("none");
            expect(reducedMotionDeclarationsOf(BLUEPRINT_CSS, LOADER_PEN).get("visibility")).toBe("hidden");
        });

        // Loaders obey only the system's reduced motion, never the app's motion setting
        it("should not tie any loader rule to the motion setting", () => {
            const loaderSelectors: string[] = [];
            postcss.parse(BLUEPRINT_CSS).walkRules((rule) => {
                loaderSelectors.push(...rule.selectors.map(collapse).filter(selector => selector.includes(".blueprint-loader")));
            });

            expect(loaderSelectors.length).toBeGreaterThan(0);
            for (const selector of loaderSelectors) {
                expect(selector).toMatch(/^\[data-style="blueprint"\] \.blueprint-loader[\w-]*(?: > span)?$/);
            }
        });
    });

    describe("erase strike", () => {
        const STRIKE = `${BOARD} [data-variant].value-leave::before`;
        // One 2px diagonal of the primary across the cell
        const diagonal = (angle: string): string =>
            `linear-gradient(${angle}, transparent calc(50% - 1px), var(--color-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px))`;

        it("should draw the erased digit in the player's hand and ink, untouchable, unseen without its animation", () => {
            const strike = declarationsOf(BLUEPRINT_CSS, STRIKE);
            const entered = declarationsOf(BLUEPRINT_CSS, `${BOARD} [data-value-kind] > div`);

            expect(strike.get("content")).toBe('attr(data-leaving-value) / ""');
            expect(strike.get("font-family")).toBe("var(--font-entry)");
            expect(strike.get("font-size")).toBe("calc(22px * var(--entry-scale, 1))");
            expect(strike.get("color")).toBe(entered.get("color"));
            expect(strike.get("pointer-events")).toBe("none");
            expect(strike.get("opacity")).toBe("0");
        });

        it("should cross it out in two 2px diagonals of the primary on the same pseudo-element", () => {
            const strike = declarationsOf(BLUEPRINT_CSS, STRIKE);

            expect(strike.get("background-image")).toBe(`${diagonal("45deg")}, ${diagonal("-45deg")}`);
        });

        // The cell's ::after carries the selection frame, so it stays while the digit is struck out
        it("should lie below the drafted lines and the selection frame", () => {
            expect(declarationsOf(BLUEPRINT_CSS, STRIKE).get("z-index")).toBe("2");
            expect(declarationsOf(BLUEPRINT_CSS, `${SCOPE} [data-skin~="board-grid"]::after`).get("z-index")).toBe("3");
            expect(declarationsOf(BLUEPRINT_CSS, `${BOARD}:not([data-hint-mode]) [data-selected]::after`).get("z-index")).toBe("4");
        });

        it("should hold still for the first 60%, then fade to nothing, with no filter or ghost", () => {
            const frames = framesOf("blueprint-strike");

            expect(frames.get("0%, 60%")?.get("opacity")).toBe("1");
            expect(frames.get("100%")?.get("opacity")).toBe("0");
            expect([...frames.values()].some(frame => frame.has("filter") || frame.has("transform"))).toBe(false);
            expect(declarationsOf(BLUEPRINT_CSS, STRIKE).has("filter")).toBe(false);
        });

        it("should run 700ms ease-in, end before the cell settles on its own, and never stay on the board", () => {
            const animation = declarationsOf(BLUEPRINT_CSS, STRIKE).get("animation") ?? "";
            const timing = animationTimingOf(animation, "blueprint-strike");

            expect(timing?.durationMs).toBe(700);
            expect(animation).toContain("ease-in");
            expect((timing?.durationMs ?? 0) + (timing?.fixedDelayMs ?? 0)).toBeLessThan(ARRIVAL_SETTLE_MS);
            expect(animation).not.toMatch(/forwards|both/);
        });

        it("should stop under reduced motion, leaving nothing seen", () => {
            expect(reducedMotionDeclarationsOf(BLUEPRINT_CSS, STRIKE).get("animation")).toBe("none");
            expect(declarationsOf(BLUEPRINT_CSS, STRIKE).get("opacity")).toBe("0");
        });
    });

    describe("digit arrival", () => {
        const timingOf = (selector: string, name: string) => animationTimingOf(declarationsOf(BLUEPRINT_CSS, selector).get("animation") ?? "", name);
        const endOf = (selector: string, name: string): number => {
            const timing = timingOf(selector, name);
            return (timing?.fixedDelayMs ?? Number.NaN) + (timing?.durationMs ?? Number.NaN);
        };
        // One 1px line of the primary
        const LINE = "linear-gradient(var(--color-primary), var(--color-primary))";

        // A pen masked by reference draws nothing in WebKit, so the arrival is the skin's alone
        it("should have no digit writer, so every engine shows the same arrival", () => {
            expect(STYLE_MOMENTS.blueprint.digitWriter).toBeUndefined();
        });

        it("should cross the arriving digit's cell with two 1px lines of the primary, above its frame, untouchable", () => {
            const crosshairs = declarationsOf(BLUEPRINT_CSS, CROSSHAIRS);

            expect(crosshairs.get("content")).toBe('""');
            expect(crosshairs.get("position")).toBe("absolute");
            expect(crosshairs.get("inset")).toBe("0");
            expect(crosshairs.get("z-index")).toBe("5");
            expect(crosshairs.get("pointer-events")).toBe("none");
            expect(crosshairs.get("background-image")).toBe(`${LINE}, ${LINE}`);
            expect(crosshairs.get("background-size")).toBe("100% 1px, 1px 100%");
            expect(crosshairs.get("background-position")).toBe("0 50%, 50% 0");
            expect(crosshairs.get("background-repeat")).toBe("no-repeat");
            // Unseen without its animation
            expect(crosshairs.get("opacity")).toBe("0");
        });

        // The canvas's headA over 0.8 of its 0.8s; the lines then stay away until the ink is in, so their end
        // (a cell pseudo-element's, which settles the arrival) never comes before the digit's
        it("should sweep the crosshairs along the canvas's headA over 0–640ms, linearly, gone until 840ms", () => {
            const frames = framesOf("blueprint-digit-crosshairs");

            expect(timingOf(CROSSHAIRS, "blueprint-digit-crosshairs")).toEqual({ durationMs: 840, fixedDelayMs: 0 });
            expect(declarationsOf(BLUEPRINT_CSS, CROSSHAIRS).get("animation")).toContain(" linear");
            expect(frames.get("0%")).toEqual(new Map([["opacity", "1"], ["transform", "translate(-30%, -30%)"]]));
            expect(frames.get("19.048%")).toEqual(new Map([["transform", "translate(22%, -18%)"]]));
            expect(frames.get("38.095%")).toEqual(new Map([["transform", "translate(-14%, 12%)"]]));
            expect(frames.get("57.143%")).toEqual(new Map([["opacity", "1"], ["transform", "translate(16%, 24%)"]]));
            // 640ms of the 840
            expect(frames.get("76.19%, 100%")).toEqual(new Map([["opacity", "0"], ["transform", "none"]]));
        });

        it("should ink the digit in from 605 to 840ms, as the canvas's inkA", () => {
            const digit = declarationsOf(BLUEPRINT_CSS, ARRIVING_DIGIT);

            expect(timingOf(ARRIVING_DIGIT, "blueprint-digit-ink")).toEqual({ durationMs: 235, fixedDelayMs: 605 });
            expect(digit.get("animation")).toContain(" ease ");
            expect(digit.get("animation")).toContain(" both");
            expect(framesOf("blueprint-digit-ink").get("from")).toEqual(new Map([["opacity", "0"]]));
            expect(framesOf("blueprint-digit-ink").get("to")).toEqual(new Map([["opacity", "1"]]));
        });

        it("should settle from the ink, the crosshairs ending with it, all before the arrival settles on its own", () => {
            const inkEndMs = endOf(ARRIVING_DIGIT, "blueprint-digit-ink");

            expect(inkEndMs).toBe(840);
            expect(endOf(CROSSHAIRS, "blueprint-digit-crosshairs")).toBe(inkEndMs);
            expect(inkEndMs).toBeLessThan(ARRIVAL_SETTLE_MS);
        });

        // Opacity and transform only: no mask, motion path or filter, so every engine draws it alike
        it("should animate only opacity and transform, with no mask, motion path or filter", () => {
            for (const name of ["blueprint-digit-crosshairs", "blueprint-digit-ink"]) {
                const properties = [...framesOf(name).values()].flatMap(frame => [...frame.keys()]);
                expect(properties.length, name).toBeGreaterThan(0);
                expect(properties.every(property => ["opacity", "transform"].includes(property)), name).toBe(true);
            }
            for (const selector of [ARRIVING_DIGIT, CROSSHAIRS]) {
                const properties = [...declarationsOf(BLUEPRINT_CSS, selector).keys()];
                expect(properties.some(property => /mask|offset-|filter/.test(property)), selector).toBe(false);
            }
            expect(BLUEPRINT_CSS).not.toContain("--digit-writer-mask");
            // The cell's own data-arriving, not :has(), which older engines lack
            expect(BLUEPRINT_CSS).not.toContain(":has(");
        });

        // Reduced motion, like the motion setting turned off, leaves no arrival: the digit simply appears
        it("should stop under reduced motion, the digit shown and the crosshairs unseen", () => {
            expect(reducedMotionDeclarationsOf(BLUEPRINT_CSS, ARRIVING_DIGIT).get("animation")).toBe("none");
            expect(reducedMotionDeclarationsOf(BLUEPRINT_CSS, CROSSHAIRS).get("animation")).toBe("none");
            expect(declarationsOf(BLUEPRINT_CSS, ARRIVING_DIGIT).has("opacity")).toBe(false);
        });
    });
    // GroupBlueprint: a dimension line snaps out along a completed row or column in three steps, a box gets a dashed
    // outline of the primary, the group's cells are hatched in the primary rippling out, and the line's margin
    // label lights; only with motion allowed, and nothing at all is left when it stops
    describe("group completion", () => {
        const GROUP_CELL = `${BOARD} [data-group]:not(.animate-hint-reveal-glow)`;
        const DIMENSION = `${SCOPE} .blueprint-group-dimension`;
        const DIMENSION_OF = {
            row: `${DIMENSION}[data-kind="row"]`,
            column: `${DIMENSION}[data-kind="column"]`,
            box: `${DIMENSION}[data-kind="box"]`,
        };
        const LIT_LABEL = `${SCOPE} .blueprint-frame-label[data-lit]`;
        const HATCH = "repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-primary) 45%, transparent) 0 1px, transparent 1px 5px)";
        const PRIMARY = "var(--color-primary)";

        const animationOf = (selector: string): string => declarationsOf(BLUEPRINT_CSS, selector).get("animation") ?? "";
        const spanOf = (selector: string, name: string): { startMs: number; endMs: number } => {
            const timing = animationTimingOf(animationOf(selector), name);
            if (timing === null) throw new Error(`${selector} does not run ${name}`);
            return { startMs: timing.fixedDelayMs, endMs: timing.fixedDelayMs + timing.durationMs };
        };
        const animatedPropertiesOf = (name: string): string[] =>
            [...new Set([...framesOf(name).values()].flatMap(frame => [...frame.keys()]))].sort();

        // Every rule outside @keyframes and reduced motion that names a group piece, with its declarations
        const groupRules = (): { selector: string; declarations: Map<string, string> }[] => {
            const rules: { selector: string; declarations: Map<string, string> }[] = [];
            postcss.parse(BLUEPRINT_CSS).walkRules((rule) => {
                if (rule.parent?.type === "atrule") return;
                const declarations = new Map<string, string>();
                rule.walkDecls((declaration) => { declarations.set(declaration.prop, collapse(declaration.value)); });
                for (const selector of rule.selectors.map(collapse).filter(item => /\[data-group\]|blueprint-group|\[data-lit\]/.test(item))) {
                    rules.push({ selector, declarations });
                }
            });
            return rules;
        };

        it("should snap a row's dimension out in three steps from 100ms over 240ms, and fade it from 780ms over 200ms", () => {
            const animation = animationOf(DIMENSION_OF.row);

            expect(spanOf(DIMENSION_OF.row, "blueprint-group-snap-x")).toEqual({ startMs: 100, endMs: 340 });
            expect(spanOf(DIMENSION_OF.row, "blueprint-group-fade")).toEqual({ startMs: 780, endMs: 980 });
            expect(animation).toContain("steps(3, end)");
            expect(framesOf("blueprint-group-snap-x").get("0%")).toEqual(new Map([["opacity", "1"], ["transform", "scaleX(0)"]]));
            expect(framesOf("blueprint-group-snap-x").get("100%")).toEqual(new Map([["opacity", "1"], ["transform", "none"]]));
        });

        it("should snap a column's dimension down it as a row's along it", () => {
            expect(spanOf(DIMENSION_OF.column, "blueprint-group-snap-y")).toEqual({ startMs: 100, endMs: 340 });
            expect(spanOf(DIMENSION_OF.column, "blueprint-group-fade")).toEqual({ startMs: 780, endMs: 980 });
            expect(animationOf(DIMENSION_OF.column)).toContain("steps(3, end)");
            expect(framesOf("blueprint-group-snap-y").get("0%")).toEqual(new Map([["opacity", "1"], ["transform", "scaleY(0)"]]));
        });

        it("should snap a box's outline out from a third from 140ms, and fade it from 800ms", () => {
            expect(spanOf(DIMENSION_OF.box, "blueprint-group-snap-box")).toEqual({ startMs: 140, endMs: 380 });
            expect(spanOf(DIMENSION_OF.box, "blueprint-group-fade")).toEqual({ startMs: 800, endMs: 1000 });
            expect(animationOf(DIMENSION_OF.box)).toContain("steps(3, end)");
            expect(framesOf("blueprint-group-snap-box").get("0%")).toEqual(new Map([["opacity", "1"], ["transform", "scale(0.333)"]]));
            expect(framesOf("blueprint-group-fade").get("to")).toEqual(new Map([["opacity", "0"]]));
        });

        it("should leave every dimension unseen without its animation, over the board's lines and untouchable", () => {
            const dimension = declarationsOf(BLUEPRINT_CSS, DIMENSION);

            expect(dimension.get("opacity")).toBe("0");
            expect(dimension.get("pointer-events")).toBe("none");
            // Over the drafted lines (3), level with the selection frame (4) and after it
            expect(dimension.get("z-index")).toBe("4");
            expect(animatedPropertiesOf("blueprint-group-snap-x")).toEqual(["opacity", "transform"]);
            expect(animatedPropertiesOf("blueprint-group-snap-box")).toEqual(["opacity", "transform"]);
        });

        it("should light a completed line's margin label in the primary for 900ms, held in one step", () => {
            expect(spanOf(LIT_LABEL, "blueprint-group-lit")).toEqual({ startMs: 0, endMs: 900 });
            expect(animationOf(LIT_LABEL)).toContain("steps(1, end)");
            expect(framesOf("blueprint-group-lit").get("0%, 100%")).toEqual(new Map([["color", PRIMARY]]));
        });

        it("should hatch the group's cells in 45% of the primary, 5px apart, from 100ms for 560ms, rippling out 45ms a step", () => {
            const step = declarationsOf(BLUEPRINT_CSS, GROUP_CELL).get("--group-ripple-step") ?? "";
            const hatch = animationOf(GROUP_CELL);

            expect(Number.parseFloat(step)).toBe(45);
            expect(Number.parseFloat(step)).toBeLessThanOrEqual(GROUP_RIPPLE_STEP_MS);
            expect(spanOf(GROUP_CELL, "blueprint-group-hatch")).toEqual({ startMs: 100, endMs: 660 });
            expect(hatch).toContain("var(--group-delay, 0ms)");
            expect(hatch).toContain(" linear ");
            expect(animatedPropertiesOf("blueprint-group-hatch")).toEqual(["background-image"]);
            expect(framesOf("blueprint-group-hatch").get("20%, 70%")).toEqual(new Map([["background-image", HATCH]]));
        });

        // The entered digit is in its own completed group (CLAUDE.md's trap): the hatch is on the cell's background, so
        // its crosshairs (the cell's ::before) and its ink (the digit's .value-arrive) run on untouched
        it("should leave the digits, the crosshairs and the strike to their own animations", () => {
            for (const { selector, declarations } of groupRules()) {
                if (!declarations.has("animation")) continue;
                expect(selector, selector).not.toMatch(/> div|::before|::after|value-arrive/);
            }
            expect(animationOf(`${BOARD} [data-variant] > .value-arrive`)).toMatch(/^blueprint-digit-ink /);
            expect(animationOf(CROSSHAIRS)).toMatch(/^blueprint-digit-crosshairs /);
        });

        it("should end each piece within the group effect", () => {
            const effectMs = STYLE_MOMENTS.blueprint.groupEffectMs;

            expect(effectMs).toBe(900);
            // The entered cell's hatch ends latest past its own ripple delay, and the label lights with it
            expect(spanOf(GROUP_CELL, "blueprint-group-hatch").endMs).toBeLessThanOrEqual(effectMs);
            expect(spanOf(LIT_LABEL, "blueprint-group-lit").endMs).toBeLessThanOrEqual(effectMs);
            // A line's farthest cell is at least four steps from the entered one, a box's two (from its centre)
            for (const kind of ["row", "column"] as const) {
                expect(spanOf(DIMENSION_OF[kind], "blueprint-group-fade").endMs, kind).toBeLessThanOrEqual(effectMs + 4 * GROUP_RIPPLE_STEP_MS);
            }
            expect(spanOf(DIMENSION_OF.box, "blueprint-group-fade").endMs).toBeLessThanOrEqual(effectMs + 2 * GROUP_RIPPLE_STEP_MS);
        });

        it("should move nothing with a filter, a mask or a motion path, and lift no cell into a layer of its own", () => {
            for (const { selector, declarations } of groupRules()) {
                const properties = [...declarations.keys()];
                expect(properties.some(property => /filter|mask|offset-/.test(property)), selector).toBe(false);
                if (selector.includes("[data-group]")) {
                    expect(properties.some(property => ["transform", "z-index", "isolation"].includes(property)), selector).toBe(false);
                }
            }
        });

        it("should stop every piece under reduced motion and leave no still cue", () => {
            const animated = groupRules().filter(({ declarations }) => declarations.has("animation"));

            expect(animated.map(({ selector }) => selector).sort()).toEqual([GROUP_CELL, LIT_LABEL, ...Object.values(DIMENSION_OF)].sort());
            for (const { selector } of animated) {
                const stopped = reducedMotionDeclarationsOf(BLUEPRINT_CSS, selector);
                expect(stopped.get("animation"), selector).toBe("none");
                expect([...stopped.keys()], selector).toEqual(["animation"]);
            }
        });
    });
    // MomentsBlueprint: two amber crosshairs sweep the board like an inspection pass, each digit they cross flashing
    // amber; a dashed frame then locks the board with its verdict (BlueprintBoardFrame draws both, ruling 11), and
    // once the dialog opens the card is plotted in from the left, the trophy ringed and the 核可 stamp pressed on
    // (BlueprintCelebration), on the dialog's clock (ruling 12)
    describe("celebration", () => {
        const PLAYING = `${BOARD}[data-celebration="playing"]`;
        const SWEEP = `${PLAYING}::before`;
        const FLASH = `${PLAYING} [data-variant] > div`;
        const FLASH_ARRIVING = `${FLASH}.value-arrive`;
        const LOCK = `${SCOPE} .blueprint-frame-lock`;
        const MARCHING_LOCK = `${SCOPE} .blueprint-frame-lock:not([data-still]) rect`;
        const LEADER = `${SCOPE} .blueprint-frame-verdict:not([data-still])::before`;
        const VERDICT_TEXT = `${SCOPE} .blueprint-frame-verdict:not([data-still]) .blueprint-frame-verdict-text`;
        const CARD = `${SCOPE} [data-skin~="card"][data-skin~="celebration"]`;
        const DRAWN_CARD = `${CARD}:not([data-still])`;
        const TROPHY = `${SCOPE} [data-skin~="trophy"]`;
        const RING = `${TROPHY}::before`;
        const DRAWN_RING = `${DRAWN_CARD} [data-skin~="trophy"]::before`;
        const STAMP = `${SCOPE} .blueprint-stamp`;
        const PRESSED_STAMP = `${SCOPE} .blueprint-celebration:not([data-still]) .blueprint-stamp`;
        const ANIMATED = [SWEEP, FLASH, FLASH_ARRIVING, MARCHING_LOCK, LEADER, VERDICT_TEXT, DRAWN_CARD, DRAWN_RING, PRESSED_STAMP];
        const PRIMARY_LINE = (angle: string): string =>
            `linear-gradient(${angle}, transparent, color-mix(in srgb, var(--color-primary) 60%, transparent) 3px, var(--color-primary) 3px 4px, color-mix(in srgb, var(--color-primary) 60%, transparent) 4px, transparent)`;

        const animationOf = (selector: string): string => declarationsOf(BLUEPRINT_CSS, selector).get("animation") ?? "";
        const spanOf = (selector: string, name: string): { startMs: number; endMs: number } => {
            const timing = animationTimingOf(animationOf(selector), name);
            if (timing === null) throw new Error(`${selector} does not run ${name}`);
            return { startMs: timing.fixedDelayMs, endMs: timing.fixedDelayMs + timing.durationMs };
        };
        const nameOf = (selector: string): string => animationOf(selector).split(" ")[0] ?? "";

        it("should open the dialog at 1300ms, as the lock is closing", () => {
            const boardMs = STYLE_MOMENTS.blueprint.celebrationBoardMs;

            expect(boardMs).toBe(1300);
            expect(STYLE_MOMENTS.blueprint.cardDecoration).toBeNull();
            expect(spanOf(MARCHING_LOCK, "blueprint-celebration-lock").endMs).toBeGreaterThan(boardMs);
        });

        describe("the sweep", () => {
            it("should cross the board with two 1px lines of the primary, glowing, past its cells, over every mark of the board", () => {
                const sweep = declarationsOf(BLUEPRINT_CSS, SWEEP);

                expect(declarationsOf(BLUEPRINT_CSS, BOARD).get("position")).toBe("relative");
                expect(sweep.get("content")).toBe('""');
                expect(sweep.get("position")).toBe("absolute");
                // The board's p-2 and the grid's 3px border are 11px; the lines reach 14px past the cells
                expect(sweep.get("inset")).toBe("-3px");
                expect(sweep.get("pointer-events")).toBe("none");
                // Over the cells' crosshairs (5), under the frame's lock (8)
                expect(sweep.get("z-index")).toBe("6");
                expect(sweep.get("background-image")).toBe(`${PRIMARY_LINE("90deg")}, ${PRIMARY_LINE("180deg")}`);
                expect(sweep.get("background-size")).toBe("7px 100%, 100% 7px");
                expect(sweep.get("background-repeat")).toBe("no-repeat");
                // Unseen without its animation
                expect(sweep.get("opacity")).toBe("0");
                expect(sweep.has("filter")).toBe(false);
            });

            it("should sweep both from the top left to the bottom right in 760ms, linearly, gone at the end", () => {
                const frames = framesOf("blueprint-celebration-sweep");

                expect(spanOf(SWEEP, "blueprint-celebration-sweep")).toEqual({ startMs: 0, endMs: 760 });
                expect(animationOf(SWEEP)).toContain(" linear");
                expect(frames.get("0%")).toEqual(new Map([["opacity", "1"], ["background-position", "10.5px 0, 0 10.5px"]]));
                expect(frames.get("92%")).toEqual(new Map([["opacity", "1"]]));
                expect(frames.get("100%")).toEqual(new Map([["opacity", "0"], ["background-position", "calc(100% - 10.5px) 0, 0 calc(100% - 10.5px)"]]));
            });

            it("should flash each digit in the primary as the lines cross it, 42ms a step from the top left, for 420ms", () => {
                const flash = animationOf(FLASH);

                expect(nameOf(FLASH)).toBe("blueprint-group-sweep");
                expect(animationTimingOf(flash, "blueprint-group-sweep")?.durationMs).toBe(420);
                expect(flash).toContain("calc((var(--cell-row) + var(--cell-column)) * 42ms)");
                expect(flash).toContain(" ease-out ");
                expect(framesOf("blueprint-group-sweep").get("from")).toEqual(new Map([["color", "var(--color-primary)"]]));
                // The farthest cell (16 steps) has flashed before the dialog opens
                expect(16 * 42 + 420).toBeLessThanOrEqual(STYLE_MOMENTS.blueprint.celebrationBoardMs);
            });

            // CLAUDE.md's trap: the last digit entered is still arriving, so the flash would replace its ink; named
            // *-group-*, the flash's end never settles the arrival either
            it("should keep the arriving digit's ink beside its flash", () => {
                const both = animationOf(FLASH_ARRIVING);

                expect(animationTimingOf(both, "blueprint-group-sweep")).toEqual(animationTimingOf(animationOf(FLASH), "blueprint-group-sweep"));
                expect(animationTimingOf(both, "blueprint-digit-ink")).toEqual(animationTimingOf(animationOf(ARRIVING_DIGIT), "blueprint-digit-ink"));
                expect(both).toContain(" both");
            });
        });

        describe("the lock", () => {
            it("should march the lock's dashes on from 720ms over 700ms, coming in over its first 12%", () => {
                const frames = framesOf("blueprint-celebration-lock");

                expect(spanOf(MARCHING_LOCK, "blueprint-celebration-lock")).toEqual({ startMs: 720, endMs: 1420 });
                expect(animationOf(MARCHING_LOCK)).toContain(" linear ");
                expect(animationOf(MARCHING_LOCK)).toContain(" both");
                // Six of its 6 4 dashes
                expect(frames.get("0%")).toEqual(new Map([["opacity", "0"], ["stroke-dashoffset", "60"]]));
                expect(frames.get("12%")).toEqual(new Map([["opacity", "1"]]));
                expect(frames.get("100%")).toEqual(new Map([["opacity", "1"], ["stroke-dashoffset", "0"]]));
                expect(declarationsOf(BLUEPRINT_CSS, LOCK).get("pointer-events")).toBe("none");
            });

            it("should pull the verdict's leader out from 1000ms over 260ms and show its words from 1220ms", () => {
                expect(spanOf(LEADER, "blueprint-celebration-lead")).toEqual({ startMs: 1000, endMs: 1260 });
                expect(animationOf(LEADER)).toContain(" ease-out ");
                expect(framesOf("blueprint-celebration-lead").get("from")).toEqual(new Map([["transform", "rotate(-140deg) scaleX(0)"]]));
                expect(framesOf("blueprint-celebration-lead").get("to")).toEqual(new Map([["transform", "rotate(-140deg) scaleX(1)"]]));
                expect(spanOf(VERDICT_TEXT, "blueprint-celebration-fade-in")).toEqual({ startMs: 1220, endMs: 1420 });
                expect(framesOf("blueprint-celebration-fade-in").get("from")).toEqual(new Map([["opacity", "0"]]));
            });
        });

        describe("the dialog", () => {
            it("should plot the card in from the left from 60ms over 520ms, its frame and shadow whole at the end", () => {
                const frames = framesOf("blueprint-celebration-draw");

                expect(spanOf(DRAWN_CARD, "blueprint-celebration-draw")).toEqual({ startMs: 60, endMs: 580 });
                expect(animationOf(DRAWN_CARD)).toContain(" linear ");
                expect(animationOf(DRAWN_CARD)).toContain(" both");
                expect(frames.get("0%")).toEqual(new Map([["clip-path", "inset(-64px 100% -64px -64px)"]]));
                expect(frames.get("100%")).toEqual(new Map([["clip-path", "inset(-64px -64px -64px -64px)"]]));
            });

            it("should ring the trophy in a 1.5px dashed line of the primary on a clear ground, the cup in the primary", () => {
                const trophy = declarationsOf(BLUEPRINT_CSS, TROPHY);
                const ring = declarationsOf(BLUEPRINT_CSS, RING);

                expect(trophy.get("position")).toBe("relative");
                expect(trophy.get("background-color")).toBe("transparent");
                expect(trophy.get("color")).toBe("var(--color-primary)");
                expect(ring.get("content")).toBe('""');
                expect(ring.get("position")).toBe("absolute");
                expect(ring.get("inset")).toBe("0");
                expect(ring.get("border")).toBe("1.5px dashed var(--color-primary)");
                expect(ring.get("border-radius")).toBe("50%");
                expect(ring.get("pointer-events")).toBe("none");
            });

            it("should draw the trophy's ring in from 580ms over 1s", () => {
                expect(spanOf(DRAWN_RING, "blueprint-celebration-trophy")).toEqual({ startMs: 580, endMs: 1580 });
                expect(animationOf(DRAWN_RING)).toContain(" ease-out ");
                expect(framesOf("blueprint-celebration-trophy").get("from")).toEqual(new Map([["border-color", "transparent"]]));
                expect(framesOf("blueprint-celebration-trophy").get("to")).toEqual(new Map([["border-color", "var(--color-primary)"]]));
            });

            // Ruling 12: the stamp at −12°, pressed from large, on a ground of 92% of the paper
            it("should press the stamp on from 700ms over 460ms, from large, turned −12°, on 92% of the paper", () => {
                const stamp = declarationsOf(BLUEPRINT_CSS, STAMP);
                const frames = framesOf("blueprint-celebration-stamp");

                expect(stamp.get("transform")).toBe("rotate(-12deg)");
                expect(stamp.get("background-color")).toBe("color-mix(in srgb, var(--color-background) 92%, transparent)");
                expect(spanOf(PRESSED_STAMP, "blueprint-celebration-stamp")).toEqual({ startMs: 700, endMs: 1160 });
                expect(animationOf(PRESSED_STAMP)).toContain(" cubic-bezier(0.2, 0.8, 0.2, 1) ");
                expect(animationOf(PRESSED_STAMP)).toContain(" both");
                expect(frames.get("0%")).toEqual(new Map([["opacity", "0"], ["transform", "rotate(-6deg) scale(1.6)"]]));
                expect(frames.get("70%")).toEqual(new Map([["opacity", "1"], ["transform", "rotate(-12deg) scale(0.95)"]]));
                expect(frames.get("100%")).toEqual(new Map([["opacity", "1"], ["transform", "rotate(-12deg) scale(1)"]]));
            });
        });

        // A still board neither sweeps nor flashes, and a still lock, verdict, card and stamp stand at their end
        it("should animate only a moving celebration, so a still board shows the end at once", () => {
            for (const selector of ANIMATED) {
                expect(animationOf(selector), selector).not.toBe("");
                expect(selector.split(":not([data-still])").join(""), selector).not.toMatch(/still/);
            }
            for (const selector of [SWEEP, FLASH, FLASH_ARRIVING]) {
                expect(selector, selector).toContain('[data-celebration="playing"]');
            }
        });

        it("should move nothing through a filter, a mask or a motion path", () => {
            const names = ANIMATED.flatMap(selector => animationOf(selector).split(",").map(layer => layer.trim().split(" ")[0] ?? ""));
            for (const name of names) {
                const properties = [...framesOf(name).values()].flatMap(frame => [...frame.keys()]);
                expect(properties.some(property => /filter|mask|offset-/.test(property)), name).toBe(false);
            }
            for (const selector of ANIMATED) {
                const properties = [...declarationsOf(BLUEPRINT_CSS, selector).keys()];
                expect(properties.some(property => /filter|mask|offset-/.test(property)), selector).toBe(false);
            }
        });

        it("should stop everything under reduced motion, showing the end", () => {
            for (const selector of ANIMATED) {
                expect(reducedMotionDeclarationsOf(BLUEPRINT_CSS, selector).get("animation"), selector).toBe("none");
            }
        });
    });
});
