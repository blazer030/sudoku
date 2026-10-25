import { readFileSync } from "fs";
import postcss, { type AtRule } from "postcss";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import { GROUP_RIPPLE_STEP_MS } from "@/presentation/pages/game/useGroupEffect";
import { animationTimingOf, declarationsOf, reducedMotionDeclarationsOf as reducedMotionDeclarationsIn } from "../../styleSheetRules";

const INK_CSS = readFileSync("src/style/styles/ink/skin.css", "utf8");

const SCOPE = '[data-style="ink"]';
const STROKE = `${SCOPE} .ink-loader-stroke`;
const REVEAL = `${SCOPE} .ink-loader-reveal`;
const DIGIT = `${SCOPE} .ink-loader-digit`;
const SEAL = `${SCOPE} .ink-loader-seal`;
const PIECES = [STROKE, REVEAL, DIGIT, SEAL];
const BOARD = `${SCOPE} [data-skin~="board"]`;
const GROUP_CELL = `${BOARD} [data-group]`;
const GROUP_DIGIT = `${GROUP_CELL}:not(.animate-hint-reveal-glow) > div`;
const ARRIVING_GROUP_DIGIT = `${GROUP_DIGIT}.value-arrive`;
const ARRIVING_DIGIT = `${BOARD} .value-arrive`;
const BRUSH = `${SCOPE} .ink-group-brush`;
const BRUSH_OF = { row: `${BRUSH}[data-kind="row"]`, column: `${BRUSH}[data-kind="column"]`, box: `${BRUSH}[data-kind="box"]` };
const REVEAL_OF = { row: `${BRUSH_OF.row} .ink-group-reveal`, column: `${BRUSH_OF.column} .ink-group-reveal`, box: `${BRUSH_OF.box} .ink-group-reveal` };
const KINDS = ["row", "column", "box"] as const;
const CELEBRATING = `${BOARD}:is([data-celebration="playing"], [data-celebration="done"])`;
const STILL_BOARD = `${BOARD}[data-celebration="still"]`;
const FIRST_WASH = `${CELEBRATING}::before`;
const SECOND_WASH = `${CELEBRATING}::after`;
const STILL_WASH = `${STILL_BOARD}::before`;
const TAKING_DIGIT = `${CELEBRATING} [data-variant] > div:not(.value-arrive):not(.animate-hint-reveal-pop)`;
const CARD = `${SCOPE} [data-skin~="card"][data-skin~="celebration"]`;
const UNROLLING_CARD = `${CARD}:not([data-still])`;
const TITLE = `${CARD} [data-skin~="complete-title"]`;
const BRUSHING_TITLE = `${UNROLLING_CARD} [data-skin~="complete-title"]`;
const ROD = `${SCOPE} .ink-rod`;
const ROD_TRACK = `${SCOPE} .ink-rod-track`;
const TRAVELLING_ROD = `${UNROLLING_CARD} .ink-rod-track`;
const SEAL_STAMP = `${SCOPE} .ink-seal-stamp`;
const PRESSING_SEAL = `${UNROLLING_CARD} .ink-seal-stamp`;
const TROPHY = `${CARD} [data-skin~="trophy"]`;
const CELEBRATION_ANIMATED = [FIRST_WASH, SECOND_WASH, TAKING_DIGIT, UNROLLING_CARD, BRUSHING_TITLE, TRAVELLING_ROD, PRESSING_SEAL];

const collapse = (text: string): string => text.replace(/\s+/g, " ").trim();

const reducedMotionDeclarationsOf = (selector: string): Map<string, string> => reducedMotionDeclarationsIn(INK_CSS, selector);

interface Frame { offsets: number[]; declarations: Map<string, string> }

// A keyframes block's frames in order, each with its offsets as percentages
const framesOf = (name: string): Frame[] => {
    const frames: Frame[] = [];
    postcss.parse(INK_CSS).walkAtRules("keyframes", (atRule) => {
        if (atRule.params.trim() !== name) return;
        atRule.walkRules((frame) => {
            const declarations = new Map<string, string>();
            frame.walkDecls((declaration) => { declarations.set(declaration.prop, collapse(declaration.value)); });
            const offsets = frame.selectors.map(offset => (offset.trim() === "from" ? 0 : offset.trim() === "to" ? 100 : Number.parseFloat(offset)));
            frames.push({ offsets, declarations });
        });
    });
    return frames;
};

// Every animated loader rule outside the reduced-motion block: its selector, its step and its animation
const loaderAnimations = (): { selector: string; step: number | null; animation: string; name: string }[] => {
    const animations: { selector: string; step: number | null; animation: string; name: string }[] = [];
    postcss.parse(INK_CSS).walkRules((rule) => {
        if (rule.parent?.type === "atrule" && ["keyframes", "media"].includes((rule.parent as AtRule).name)) return;
        rule.walkDecls("animation", (declaration) => {
            for (const selector of rule.selectors.map(collapse)) {
                if (!selector.includes(".ink-loader")) continue;
                const step = /\[data-step="(\d+)"\]/.exec(selector)?.[1];
                const animation = collapse(declaration.value);
                animations.push({ selector, step: step === undefined ? null : Number(step), animation, name: animation.split(" ")[0] ?? "" });
            }
        });
    });
    return animations;
};

const animationsOf = (piece: string) => loaderAnimations().filter(animation => animation.selector.startsWith(piece));

// The last offset at which a piece is still hidden, and the first at which it shows whole
const hiddenUntil = (name: string): number => framesOf(name)[0]?.offsets.reduce((latest, offset) => Math.max(latest, offset), 0) ?? 0;
const wholeFrom = (name: string, property: string, whole: string): number =>
    framesOf(name).find(frame => frame.declarations.get(property) === whole)?.offsets[0] ?? Infinity;
// The last offset at which a piece still shows, before it fades for the next round
const fadeFrom = (name: string): number =>
    Math.max(...framesOf(name).filter(frame => frame.declarations.get("opacity") !== "0").flatMap(frame => frame.offsets));

const byStep = <T extends { step: number | null }>(animations: T[]): T[] => [...animations].sort((first, second) => (first.step ?? 0) - (second.step ?? 0));

const animationOf = (selector: string): string => declarationsOf(INK_CSS, selector).get("animation") ?? "";

interface Span { startMs: number; endMs: number }

const spanOf = (selector: string, name: string): Span => {
    const timing = animationTimingOf(animationOf(selector), name);
    if (timing === null) throw new Error(`${selector} does not run ${name}`);
    return { startMs: timing.fixedDelayMs, endMs: timing.fixedDelayMs + timing.durationMs };
};

const animatedPropertiesOf = (name: string): Set<string> => new Set(framesOf(name).flatMap(frame => [...frame.declarations.keys()]));

// The z-index a selector sets anywhere outside keyframes and reduced motion (the grid lines sit in @supports)
const zIndexOf = (selector: string): number => {
    let zIndex = Number.NaN;
    postcss.parse(INK_CSS).walkRules((rule) => {
        if (!rule.selectors.map(collapse).includes(selector)) return;
        rule.walkDecls("z-index", (declaration) => { zIndex = Number(declaration.value); });
    });
    return zIndex;
};

// Evaluates a calc() body of numbers, + - *, parentheses and max(), as the take's delay is written
const evaluate = (expression: string): number => {
    const tokens = expression.match(/max|\d*\.?\d+|[-+*(),]/g) ?? [];
    let position = 0;
    const next = (): string => tokens[position++] ?? "";
    const peek = (): string => tokens[position] ?? "";
    const parseSum = (): number => {
        let total = parseProduct();
        while (peek() === "+" || peek() === "-") total = next() === "+" ? total + parseProduct() : total - parseProduct();
        return total;
    };
    const parseProduct = (): number => {
        let product = parseTerm();
        while (peek() === "*") {
            next();
            product *= parseTerm();
        }
        return product;
    };
    const parseTerm = (): number => {
        const token = next();
        if (token === "(") {
            const value = parseSum();
            next();
            return value;
        }
        if (token === "max") {
            next();
            const values = [parseSum()];
            while (next() === ",") values.push(parseSum());
            return Math.max(...values);
        }
        return Number(token);
    };
    return parseSum();
};

// A digit's ink-take delay in a given cell, from its calc() over the cell's row and column
const takeDelayAt = (row: number, column: number): number => {
    const delay = /ink-take \S+ \S+ calc\((.*)\) \S+$/.exec(animationOf(TAKING_DIGIT))?.[1] ?? "";
    if (delay === "") throw new Error("the take has no calc() delay");
    return evaluate(delay
        .replace(/var\(--cell-row\)/g, String(row))
        .replace(/var\(--cell-column\)/g, String(column))
        .replace(/ms/g, ""));
};

describe("ink moments", () => {
    describe("group completion", () => {
        it("should sweep a row's brush and a column's alike, and ring a box after them", () => {
            for (const name of ["ink-brush-life", "ink-brush-reveal"]) {
                const selectors = name === "ink-brush-life" ? BRUSH_OF : REVEAL_OF;
                expect(spanOf(selectors.column, name)).toEqual(spanOf(selectors.row, name));
                expect(spanOf(selectors.box, name).startMs).toBeGreaterThan(spanOf(selectors.row, name).startMs);
            }
        });

        it("should draw each stroke along its mask as it shows, and finish it while the brush is held", () => {
            const lastHeld = Math.max(...framesOf("ink-brush-life").filter(frame => frame.declarations.get("opacity") === "1").flatMap(frame => frame.offsets));
            for (const kind of KINDS) {
                const life = spanOf(BRUSH_OF[kind], "ink-brush-life");
                const reveal = spanOf(REVEAL_OF[kind], "ink-brush-reveal");

                expect(reveal.startMs, kind).toBe(life.startMs);
                expect(reveal.endMs, kind).toBeLessThanOrEqual(life.startMs + ((life.endMs - life.startMs) * lastHeld) / 100);
                // Hidden along its whole length until it starts
                expect(animationOf(REVEAL_OF[kind]), kind).toMatch(/ both$/);
            }
            const dash = declarationsOf(INK_CSS, `${SCOPE} .ink-group-reveal`);
            expect(dash.get("stroke-dashoffset")).toBe(dash.get("stroke-dasharray"));
            const boxDash = declarationsOf(INK_CSS, REVEAL_OF.box);
            expect(boxDash.get("stroke-dashoffset")).toBe(boxDash.get("stroke-dasharray"));
        });

        it("should reveal the strokes by their dash offset only, and show the brush by opacity only", () => {
            expect([...animatedPropertiesOf("ink-brush-reveal")]).toEqual(["stroke-dashoffset"]);
            expect(framesOf("ink-brush-reveal").slice(-1)[0]?.declarations.get("stroke-dashoffset")).toBe("0");
            expect([...animatedPropertiesOf("ink-brush-life")]).toEqual(["opacity"]);
            // Unseen without its animation, so a stopped effect leaves nothing on the board
            expect(declarationsOf(INK_CSS, BRUSH).get("opacity")).toBe("0");
            const frames = framesOf("ink-brush-life");
            expect(frames[0]?.declarations.get("opacity")).toBe("0");
            expect(frames[frames.length - 1]?.declarations.get("opacity")).toBe("0");
        });

        it("should play every group cell at once, never above the timer's ripple step", () => {
            const step = declarationsOf(INK_CSS, GROUP_CELL).get("--group-ripple-step") ?? "";

            expect(Number.parseFloat(step)).toBe(0);
            expect(Number.parseFloat(step)).toBeLessThanOrEqual(GROUP_RIPPLE_STEP_MS);
        });

        it("should halo a completed group's digits in the paper's colour while the brush is over them", () => {
            const frames = framesOf("ink-group-halo");
            const life = spanOf(BRUSH_OF.row, "ink-brush-life");
            const halo = spanOf(GROUP_DIGIT, "ink-group-halo");

            expect([...animatedPropertiesOf("ink-group-halo")]).toEqual(["text-shadow"]);
            expect(frames.some(frame => frame.declarations.get("text-shadow")?.includes("var(--color-card)"))).toBe(true);
            for (const edge of [0, 100]) {
                expect(frames.find(frame => frame.offsets.includes(edge))?.declarations.get("text-shadow"), `${edge}%`).toBe("none");
            }
            expect(halo).toEqual(life);
        });

        // The entered digit is in its own completed group: the group's halo must not replace its bleed
        it("should bleed the entered digit in under the group's halo", () => {
            const combined = animationOf(ARRIVING_GROUP_DIGIT);

            expect(animationTimingOf(combined, "ink-bleed")).toEqual(animationTimingOf(animationOf(ARRIVING_DIGIT), "ink-bleed"));
            expect(animationTimingOf(combined, "ink-group-halo")).toEqual(animationTimingOf(animationOf(GROUP_DIGIT), "ink-group-halo"));
            expect(combined).toContain(animationOf(ARRIVING_DIGIT));
            expect(reducedMotionDeclarationsOf(ARRIVING_GROUP_DIGIT).get("animation")).toBe("none");
        });

        it("should end each cell's halo within the group effect, and each stroke by the time the effect's timer ends", () => {
            const effectMs = STYLE_MOMENTS.ink.groupEffectMs;

            expect(spanOf(GROUP_DIGIT, "ink-group-halo").endMs).toBeLessThanOrEqual(effectMs);
            expect(spanOf(ARRIVING_GROUP_DIGIT, "ink-group-halo").endMs).toBeLessThanOrEqual(effectMs);
            // A line's farthest cell is at least four steps from the entered one, a box's two
            for (const kind of ["row", "column"] as const) {
                expect(spanOf(BRUSH_OF[kind], "ink-brush-life").endMs, kind).toBeLessThanOrEqual(effectMs);
            }
            // A box alone, completed from its centre, has its farthest cell two steps out: the ring must end
            // before that timer does, by at least a couple of frames for the overlay to mount and style
            const frameMarginMs = 2 * 16;
            expect(spanOf(BRUSH_OF.box, "ink-brush-life").endMs + frameMarginMs).toBeLessThanOrEqual(effectMs + 2 * GROUP_RIPPLE_STEP_MS);
        });

        it("should lay the brush over the cells' washes, under the digits, the brush lines and the 圓相", () => {
            const brush = zIndexOf(BRUSH);

            expect(brush).toBe(1);
            expect(zIndexOf(`${BOARD} [data-variant] > div`)).toBe(2);
            expect(zIndexOf(`${SCOPE} [data-skin~="board-grid"]::after`)).toBeGreaterThan(zIndexOf(`${BOARD} [data-variant] > div`));
            expect(zIndexOf(`${BOARD}:not([data-hint-mode]) [data-selected]::after`)).toBeGreaterThan(zIndexOf(`${SCOPE} [data-skin~="board-grid"]::after`));
            // Level with the entered digit's halo: the overlay follows the cells, so the brush lies over it
            expect(zIndexOf(`${BOARD} [data-variant]:has(> .value-arrive)::before`)).toBe(brush);
        });

        // Reveal Cell can complete a group: its digit keeps the hint pop, which a group rule would replace
        it("should leave a revealed hint's digit to its pop", () => {
            const groupDigitSelectors: string[] = [];
            postcss.parse(INK_CSS).walkRules((rule) => {
                groupDigitSelectors.push(...rule.selectors.map(collapse).filter(selector => /\[data-group\][^ ]* > div/.test(selector)));
            });

            expect(groupDigitSelectors.length).toBeGreaterThanOrEqual(4);
            for (const selector of groupDigitSelectors) {
                expect(selector).toContain("[data-group]:not(.animate-hint-reveal-glow) > div");
            }
        });

        it("should stop every brush and halo under reduced motion", () => {
            for (const selector of [...Object.values(BRUSH_OF), ...Object.values(REVEAL_OF), GROUP_DIGIT, ARRIVING_GROUP_DIGIT]) {
                expect(reducedMotionDeclarationsOf(selector).get("animation"), selector).toBe("none");
            }
        });
    });

    describe("celebration", () => {
        it("should bloom two ink washes on the board's own layers, the second a beat later, and keep them under the dialog", () => {
            const first = spanOf(FIRST_WASH, "ink-board-wash");
            const second = spanOf(SECOND_WASH, "ink-board-wash");
            const frames = framesOf("ink-board-wash");

            expect(second.endMs - second.startMs).toBe(first.endMs - first.startMs);
            expect(second.startMs).toBeGreaterThan(first.startMs);
            // Hidden until it blooms, and still there once it has
            expect(frames[0]?.declarations.get("opacity")).toBe("0");
            expect(Number(frames[frames.length - 1]?.declarations.get("opacity"))).toBeGreaterThan(0);
            expect(animationOf(FIRST_WASH)).toMatch(/ both$/);
            for (const wash of [FIRST_WASH, SECOND_WASH]) {
                expect(declarationsOf(INK_CSS, wash).get("opacity"), wash).toBe("0");
            }
        });

        it("should wash the board in ink by gradients, moving only by opacity and transform, with no filter", () => {
            const washes = declarationsOf(INK_CSS, `${CELEBRATING}::before`);

            expect(washes.get("background-image")).toMatch(/^radial-gradient\(/);
            expect(washes.get("background-image")).toContain("var(--color-foreground)");
            expect([...animatedPropertiesOf("ink-board-wash")].sort()).toEqual(["opacity", "transform"]);
            for (const selector of [FIRST_WASH, SECOND_WASH, STILL_WASH]) {
                expect(declarationsOf(INK_CSS, selector).has("filter"), selector).toBe(false);
            }
            // Under the digits, inside the board's own stacking context
            expect(zIndexOf(`${CELEBRATING}::before`)).toBeLessThan(zIndexOf(`${BOARD} [data-variant] > div`));
            expect(declarationsOf(INK_CSS, BOARD).get("isolation")).toBe("isolate");
            expect(declarationsOf(INK_CSS, BOARD).get("position")).toBe("relative");
        });

        // The washes swell past the board's box; unclipped, they widened the page scroller while celebrating
        it("should keep the blooming washes inside the board's box", () => {
            const scaledBeyond = framesOf("ink-board-wash").some((frame) => {
                const scale = /scale\(([\d.]+)\)/.exec(frame.declarations.get("transform") ?? "")?.[1];
                return scale !== undefined && Number(scale) > 1;
            });

            expect(scaledBeyond).toBe(true);
            expect(declarationsOf(INK_CSS, CELEBRATING).get("overflow")).toBe("clip");
        });

        it("should let the digits take the ink from the centre outward, all before the dialog opens", () => {
            const take = animationTimingOf(animationOf(TAKING_DIGIT), "ink-take");
            const farthest = takeDelayAt(0, 0);

            expect(takeDelayAt(4, 4)).toBe(0);
            expect(takeDelayAt(4, 5)).toBeGreaterThan(0);
            expect(takeDelayAt(3, 5)).toBeGreaterThan(takeDelayAt(4, 5));
            expect(takeDelayAt(8, 8)).toBe(farthest);
            expect(takeDelayAt(0, 8)).toBe(farthest);
            expect(farthest + (take?.durationMs ?? Infinity)).toBeLessThanOrEqual(STYLE_MOMENTS.ink.celebrationBoardMs);
        });

        it("should leave each digit sharp, in a halo of paper, once it has taken the ink", () => {
            const frames = framesOf("ink-take");
            const last = frames[frames.length - 1]?.declarations ?? new Map<string, string>();

            expect(frames[0]?.declarations.get("text-shadow")).toBe("none");
            expect(last.get("opacity")).toBe("1");
            expect(last.get("transform")).toBe("none");
            expect(last.get("text-shadow")).toContain("var(--color-card)");
            expect(animationOf(TAKING_DIGIT)).toMatch(/ both$/);
        });

        it("should hold one faint wash still, and nothing moving, when still", () => {
            const wash = declarationsOf(INK_CSS, STILL_WASH);
            const opacity = Number(wash.get("opacity"));

            expect(opacity).toBeGreaterThan(0);
            expect(opacity).toBeLessThan(1);
            expect(wash.get("background-image")).toBe(declarationsOf(INK_CSS, `${CELEBRATING}::before`).get("background-image"));
            expect(wash.has("animation")).toBe(false);
            expect(declarationsOf(INK_CSS, `${STILL_BOARD}::after`).size).toBe(0);
            const stillRules: string[] = [];
            postcss.parse(INK_CSS).walkRules((rule) => {
                if (!rule.selectors.some(selector => selector.includes('[data-celebration="still"]'))) return;
                rule.walkDecls("animation", (declaration) => { stillRules.push(`${rule.selector} → ${declaration.value}`); });
            });
            expect(stillRules).toEqual([]);
        });

        it("should unroll the card from its top by its clip, the bottom rod travelling with the edge", () => {
            const unroll = spanOf(UNROLLING_CARD, "ink-unroll");
            const rod = spanOf(TRAVELLING_ROD, "ink-rod");
            const frames = framesOf("ink-unroll");

            expect(unroll.startMs).toBeGreaterThan(0);
            expect(rod).toEqual(unroll);
            expect(animationOf(TRAVELLING_ROD).replace("ink-rod", "")).toBe(animationOf(UNROLLING_CARD).replace("ink-unroll", ""));
            expect(frames[0]?.declarations.get("clip-path")).toMatch(/^inset\(\S+ \S+ calc\(100% - [\d.]+px\) \S+\)$/);
            expect(frames[frames.length - 1]?.declarations.get("clip-path")).toMatch(/^inset\((-[\d.]+px ?){4}\)$/);
            // Held rolled up until it starts; the rod starts at the top and ends where the card's foot is
            expect(animationOf(UNROLLING_CARD)).toMatch(/ both$/);
            expect(framesOf("ink-rod")[0]?.declarations.get("transform")).toBe("translateY(-100%)");
            expect(framesOf("ink-rod").slice(-1)[0]?.declarations.get("transform")).toBe("none");
            expect([...animatedPropertiesOf("ink-rod")]).toEqual(["transform"]);
        });

        it("should brush the title in from the left as the scroll opens, then press the seal", () => {
            const unroll = spanOf(UNROLLING_CARD, "ink-unroll");
            const title = spanOf(BRUSHING_TITLE, "ink-brush");
            const press = spanOf(PRESSING_SEAL, "ink-press");
            const brush = framesOf("ink-brush");

            expect(title.startMs).toBeGreaterThan(unroll.startMs);
            expect(title.startMs).toBeLessThan(unroll.endMs);
            expect(press.startMs).toBeGreaterThan(title.startMs);
            expect(press.startMs).toBeGreaterThanOrEqual(unroll.endMs);
            expect(brush[0]?.declarations.get("clip-path")).toBe("inset(0 100% 0 0)");
            expect(brush[brush.length - 1]?.declarations.get("clip-path")).toBe("inset(0 0 0 0)");
            expect(framesOf("ink-press")[0]?.declarations.get("opacity")).toBe("0");
            for (const selector of [BRUSHING_TITLE, PRESSING_SEAL]) {
                expect(animationOf(selector), selector).toMatch(/ both$/);
            }
        });

        it("should show the still card's end state: open, titled and sealed", () => {
            const pressed = framesOf("ink-press").slice(-1)[0]?.declarations ?? new Map<string, string>();

            for (const selector of [CARD, TITLE, SEAL_STAMP, ROD, ROD_TRACK]) {
                const declarations = declarationsOf(INK_CSS, selector);
                expect(declarations.has("animation"), selector).toBe(false);
                expect(declarations.has("clip-path"), selector).toBe(false);
                expect(declarations.has("opacity"), selector).toBe(false);
            }
            expect(declarationsOf(INK_CSS, SEAL_STAMP).get("transform")).toBe(pressed.get("transform"));
            expect(pressed.get("opacity")).toBe("1");
        });

        it("should cut the seal in vermilion with a paper ring, worn by a grainy mask, and make the trophy that seal turned", () => {
            const seal = declarationsOf(INK_CSS, SEAL_STAMP);
            const trophy = declarationsOf(INK_CSS, TROPHY);

            expect(seal.get("background-color")).toBe("var(--color-primary)");
            expect(seal.get("color")).toBe("var(--color-on-primary)");
            expect(seal.get("box-shadow")).toContain("var(--color-on-primary)");
            expect(seal.get("mask-image")).toMatch(/^repeating-radial-gradient\(/);
            expect(seal.get("-webkit-mask-image")).toBe(seal.get("mask-image"));
            expect(trophy.get("background-color")).toBe(seal.get("background-color"));
            expect(trophy.get("border-radius")).toBe(seal.get("border-radius"));
            expect(trophy.get("transform")).toMatch(/^rotate\(-[\d.]+deg\)$/);
            expect(declarationsOf(INK_CSS, `${TROPHY} > svg`).get("color")).toBe(seal.get("color"));
        });

        it("should hang the rods in a warm ink", () => {
            const rod = declarationsOf(INK_CSS, ROD);

            expect(rod.get("background-image")).toMatch(/^linear-gradient\(/);
            expect(rod.get("background-image")).toContain("var(--color-foreground)");
            expect(rod.get("background-image")).toContain("color-mix(");
        });

        it("should stop every part of it under reduced motion", () => {
            for (const selector of CELEBRATION_ANIMATED) {
                expect(reducedMotionDeclarationsOf(selector).get("animation"), selector).toBe("none");
            }
        });
    });

    describe("loader", () => {
        it("should run the strokes, their reveals, the digits and the seal on one 4.2s infinite loop", () => {
            for (const piece of PIECES) {
                expect(animationsOf(piece).length, piece).toBeGreaterThan(0);
            }
            for (const { selector, animation, name } of loaderAnimations()) {
                expect(animationTimingOf(animation, name)?.durationMs, selector).toBe(4200);
                expect(animation, selector).toMatch(/ infinite both$/);
            }
        });

        it("should reveal each stroke by its own step, one keyframes block a step", () => {
            const strokes = animationsOf(STROKE);
            const reveals = animationsOf(REVEAL);
            const steps = strokes.map(stroke => stroke.step).sort((first, second) => (first ?? 0) - (second ?? 0));

            expect(steps.length).toBeGreaterThan(0);
            expect(steps).toEqual(steps.map((_, position) => position));
            expect(reveals.map(reveal => reveal.step).sort((first, second) => (first ?? 0) - (second ?? 0))).toEqual(steps);
            expect(new Set(loaderAnimations().map(animation => animation.name)).size).toBe(loaderAnimations().length);
        });

        it("should start every round with each piece hidden and wipe the slip at its end", () => {
            const dashLength = declarationsOf(INK_CSS, REVEAL).get("stroke-dasharray");

            expect(dashLength).toBeDefined();
            for (const { name } of loaderAnimations()) {
                const frames = framesOf(name);
                const first = frames[0]?.declarations ?? new Map<string, string>();
                const last = frames[frames.length - 1]?.declarations ?? new Map<string, string>();

                expect(frames[0]?.offsets, name).toContain(0);
                expect(frames[frames.length - 1]?.offsets, name).toContain(100);
                if (first.has("opacity")) {
                    expect(first.get("opacity"), name).toBe("0");
                    expect(last.get("opacity"), name).toBe("0");
                } else {
                    expect(first.get("stroke-dashoffset"), name).toBe(dashLength);
                }
            }
        });

        it("should animate only opacity, transform and the reveals' dash offset", () => {
            expect(loaderAnimations().length).toBeGreaterThan(0);
            for (const { name } of loaderAnimations()) {
                const properties = new Set(framesOf(name).flatMap(frame => [...frame.declarations.keys()]));

                expect([...properties].every(property => ["opacity", "transform", "stroke-dashoffset"].includes(property)), name).toBe(true);
            }
        });

        it("should brush the strokes in turn, then write the digits in turn, then press the seal", () => {
            const strokes = byStep(animationsOf(STROKE));
            const reveals = byStep(animationsOf(REVEAL)).map(({ name }) => name);
            const digits = byStep(animationsOf(DIGIT)).map(({ name }) => name);
            const seals = animationsOf(SEAL).map(({ name }) => name);

            strokes.forEach((stroke, position) => {
                // The stroke shows as its reveal starts, and the next one starts later (the brush may lift a
                // beat before a stroke's tail is drawn)
                expect(hiddenUntil(reveals[position]), stroke.selector).toBeGreaterThanOrEqual(hiddenUntil(stroke.name));
                if (position + 1 < reveals.length) expect(hiddenUntil(reveals[position + 1])).toBeGreaterThan(hiddenUntil(reveals[position]));
            });
            const lastStrokeDrawn = wholeFrom(reveals[reveals.length - 1], "stroke-dashoffset", "0");
            digits.forEach((digit, position) => {
                const previousWritten = position === 0 ? lastStrokeDrawn : wholeFrom(digits[position - 1], "opacity", "1");
                expect(hiddenUntil(digit), digit).toBeGreaterThanOrEqual(previousWritten);
            });
            expect(seals).toHaveLength(1);
            expect(hiddenUntil(seals[0])).toBeGreaterThanOrEqual(wholeFrom(digits[digits.length - 1], "opacity", "1"));
        });

        it("should fade the strokes, the digits and the seal together", () => {
            const fading = [...animationsOf(STROKE), ...animationsOf(DIGIT), ...animationsOf(SEAL)].map(({ name }) => fadeFrom(name));

            expect(new Set(fading).size).toBe(1);
        });

        it("should hold the sketch drawn under reduced motion, as the loop shows it whole", () => {
            for (const { selector } of loaderAnimations()) {
                expect(reducedMotionDeclarationsOf(selector).get("animation"), selector).toBe("none");
            }
            const [stroke] = animationsOf(STROKE);
            const heldStroke = framesOf(stroke.name).find(frame => frame.declarations.get("opacity") !== "0")?.declarations.get("opacity");
            const [seal] = animationsOf(SEAL);
            const pressedSeal = framesOf(seal.name).find(frame => frame.declarations.get("opacity") === "1" && frame.offsets.length > 1)?.declarations.get("transform");

            expect(reducedMotionDeclarationsOf(STROKE).get("opacity")).toBe(heldStroke);
            expect(reducedMotionDeclarationsOf(REVEAL).get("stroke-dashoffset")).toBe("0");
            expect(reducedMotionDeclarationsOf(DIGIT).get("opacity")).toBe("1");
            expect(reducedMotionDeclarationsOf(SEAL).get("opacity")).toBe("1");
            // Settled where the press leaves it
            expect(declarationsOf(INK_CSS, SEAL).get("transform")).toBe(pressedSeal);
        });

        // Loaders obey only the system's reduced motion, never the app's motion setting
        it("should not tie any loader rule to the motion setting", () => {
            const loaderSelectors: string[] = [];
            postcss.parse(INK_CSS).walkRules((rule) => {
                loaderSelectors.push(...rule.selectors.map(collapse).filter(selector => selector.includes(".ink-loader")));
            });

            expect(loaderSelectors.length).toBeGreaterThan(0);
            for (const selector of loaderSelectors) {
                expect(selector).toMatch(/^\[data-style="ink"\](?:\[data-ink-fonts="ready"\])? \.ink-loader[\w-]*(?:\[data-step="\d+"\])?$/);
            }
        });
    });
});
