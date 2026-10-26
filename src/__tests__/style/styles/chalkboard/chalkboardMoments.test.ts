import { readFileSync } from "fs";
import postcss from "postcss";
import { ARRIVAL_SETTLE_MS } from "@/presentation/components/board-cell/useArrivalMotion";
import { CHALKBOARD_DIGIT_DUST } from "@/presentation/components/style-moments/chalkboard/chalkboardDigitStrokes";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import { GROUP_RIPPLE_STEP_MS } from "@/presentation/pages/game/useGroupEffect";
import ChalkboardDigitWriter from "@/presentation/components/style-moments/chalkboard/ChalkboardDigitWriter.vue";
import { animationTimingOf, declarationsOf, reducedMotionDeclarationsOf as reducedMotionDeclarationsIn } from "../../styleSheetRules";

const CHALKBOARD_CSS = readFileSync("src/style/styles/chalkboard/skin.css", "utf8");

const SCOPE = '[data-style="chalkboard"]';
// 黑板: the codebase's dark mode selector
const DARK = ':root.dark[data-style="chalkboard"]';
const WRITTEN_DIGIT = `${SCOPE}[data-chalkboard-fonts="ready"] [data-skin~="board"] .font-entry.value-arrive`;
const DARK_WRITTEN_DIGIT = `${DARK}[data-chalkboard-fonts="ready"] [data-skin~="board"] [data-variant] > .font-entry.value-arrive`;
const PEN_STROKE = `${SCOPE} .chalkboard-digit-stroke`;
const PEN_SETTLE = `${SCOPE} .chalkboard-digit-settle`;
const DUST = `${SCOPE} .chalkboard-digit-dust`;
const DARK_DUST = `${DARK} .chalkboard-digit-dust`;
const GRAIN = "var(--chalkboard-grain)";

const reducedMotionDeclarationsOf = (selector: string): Map<string, string> => reducedMotionDeclarationsIn(CHALKBOARD_CSS, selector);

// The first and last frames of a keyframes block, as "property: value" lists
const keyframeEnds = (name: string): { from: Map<string, string>; to: Map<string, string> } => {
    const frames: Map<string, string>[] = [];
    postcss.parse(CHALKBOARD_CSS).walkAtRules("keyframes", (atRule) => {
        if (atRule.params !== name) return;
        atRule.walkRules((frame) => {
            const declarations = new Map<string, string>();
            frame.walkDecls((declaration) => { declarations.set(declaration.prop, declaration.value.trim()); });
            frames.push(declarations);
        });
    });
    return { from: frames[0] ?? new Map(), to: frames[frames.length - 1] ?? new Map() };
};

// Every selector of a rule, outside @keyframes and reduced motion, that animates something matching `fragment`
const animatingSelectorsOf = (fragment: string): string[] => {
    const selectors: string[] = [];
    postcss.parse(CHALKBOARD_CSS).walkRules((rule) => {
        const parent = rule.parent;
        if (parent?.type === "atrule" && ["keyframes", "media"].includes((parent as postcss.AtRule).name)) return;
        if (!rule.some(node => node.type === "decl" && node.prop.startsWith("animation"))) return;
        selectors.push(...rule.selectors.filter(selector => selector.includes(fragment)));
    });
    return selectors;
};

const LOADER_STROKE = `${SCOPE} .chalkboard-loader-stroke`;
const LOADER_RING = `${SCOPE} .chalkboard-loader-ring`;
const LOADER_DIGIT = `${SCOPE} .chalkboard-loader-digit`;
const LOADER_REVEAL = `${SCOPE} .chalkboard-loader-reveal`;
const LOADER_DUST = `${SCOPE} .chalkboard-loader-dust`;
const DARK_LOADER_DUST = `${DARK} .chalkboard-loader-dust`;
const LOADER_DUSTER = `${SCOPE} .chalkboard-loader-duster`;
const LOADER_SMEAR = `${SCOPE} .chalkboard-loader-smear`;
const LOADER_PIECES = [LOADER_STROKE, LOADER_RING, LOADER_DIGIT, LOADER_REVEAL, DARK_LOADER_DUST, LOADER_DUSTER, LOADER_SMEAR];


const BOARD = `${SCOPE} [data-skin~="board"]`;
const GROUP_CELL = `${BOARD} [data-group]:not(.animate-hint-reveal-glow)`;
const GROUP_DIGIT = `${GROUP_CELL} > div`;
const GROUP_LINE = `${SCOPE} .chalkboard-group-line`;
const GROUP_STROKE_OF = {
    row: `${GROUP_LINE}[data-kind="row"] .chalkboard-group-stroke`,
    column: `${GROUP_LINE}[data-kind="column"] .chalkboard-group-stroke`,
    box: `${GROUP_LINE}[data-kind="box"] .chalkboard-group-stroke`,
};
const GROUP_DUST = `${SCOPE} .chalkboard-group-dust`;
const DARK_GROUP_DUST_STEPS = [0, 1, 2].map(step => `${DARK} .chalkboard-group-dust[data-step="${step}"]`);

const collapse = (text: string): string => text.replace(/\s+/g, " ").trim();

interface Frame { offsets: number[]; declarations: Map<string, string> }

// A keyframes block's frames in order, each with its offsets as percentages
const framesOf = (name: string): Frame[] => {
    const frames: Frame[] = [];
    postcss.parse(CHALKBOARD_CSS).walkAtRules("keyframes", (atRule) => {
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

interface LoaderAnimation { selector: string; step: number | null; animation: string; name: string }

// Every animated loader rule outside @keyframes and reduced motion: its selector, its step and its animation
const loaderAnimations = (): LoaderAnimation[] => {
    const animations: LoaderAnimation[] = [];
    postcss.parse(CHALKBOARD_CSS).walkRules((rule) => {
        if (rule.parent?.type === "atrule" && ["keyframes", "media"].includes((rule.parent as postcss.AtRule).name)) return;
        rule.walkDecls("animation", (declaration) => {
            for (const selector of rule.selectors.map(collapse)) {
                if (!selector.includes(".chalkboard-loader")) continue;
                const step = /\[data-step="(\d+)"\]/.exec(selector)?.[1];
                const animation = collapse(declaration.value);
                animations.push({ selector, step: step === undefined ? null : Number(step), animation, name: animation.split(" ")[0] ?? "" });
            }
        });
    });
    return animations;
};

const animationsOf = (piece: string): LoaderAnimation[] =>
    loaderAnimations().filter(animation => animation.selector.startsWith(piece))
        .sort((first, second) => (first.step ?? 0) - (second.step ?? 0));

// The last offset at which a piece is still hidden, and the first at which it shows whole
const hiddenUntil = (name: string): number => framesOf(name)[0]?.offsets.reduce((latest, offset) => Math.max(latest, offset), 0) ?? 0;
const wholeFrom = (name: string, property: string, whole: string): number =>
    framesOf(name).find(frame => frame.declarations.get(property) === whole)?.offsets[0] ?? Infinity;


interface Span { startMs: number; endMs: number }

// When an animation runs on a selector, from its fixed delay to its end
const spanOf = (selector: string, name: string): Span => {
    const timing = animationTimingOf(declarationsOf(CHALKBOARD_CSS, selector).get("animation") ?? "", name);
    if (timing === null) throw new Error(`${selector} does not run ${name}`);
    return { startMs: timing.fixedDelayMs, endMs: timing.fixedDelayMs + timing.durationMs };
};

const animatedPropertiesOf = (name: string): Set<string> => new Set(framesOf(name).flatMap(frame => [...frame.declarations.keys()]));

// The z-index a selector sets anywhere outside keyframes and reduced motion
const zIndexOf = (selector: string): number => {
    let zIndex = Number.NaN;
    postcss.parse(CHALKBOARD_CSS).walkRules((rule) => {
        if (!rule.selectors.map(collapse).includes(selector)) return;
        rule.walkDecls("z-index", (declaration) => { zIndex = Number(declaration.value); });
    });
    return zIndex;
};

// Every selector of a rule outside @keyframes and reduced motion that matches `pattern`, with what it declares
const rulesMatching = (pattern: RegExp): { selector: string; declarations: Map<string, string> }[] => {
    const found: { selector: string; declarations: Map<string, string> }[] = [];
    postcss.parse(CHALKBOARD_CSS).walkRules((rule) => {
        const parent = rule.parent;
        if (parent?.type === "atrule" && ["keyframes", "media"].includes((parent as postcss.AtRule).name)) return;
        const declarations = new Map<string, string>();
        rule.walkDecls((declaration) => { declarations.set(declaration.prop, collapse(declaration.value)); });
        for (const selector of rule.selectors.map(collapse).filter(item => pattern.test(item))) found.push({ selector, declarations });
    });
    return found;
};

describe("chalkboard moments", () => {
    it("should write entered digits with chalk's pen", () => {
        expect(STYLE_MOMENTS.chalkboard.digitWriter).toBe(ChalkboardDigitWriter);
    });

    describe("digits", () => {
        // ChalkboardDigitWriter draws the strokes into a mask; the digit is its own glyph seen through it. The
        // strokes follow Caveat Brush, so only once it has loaded.
        it("should show an entered digit through its writer's mask, once Caveat Brush has loaded", () => {
            const written = declarationsOf(CHALKBOARD_CSS, WRITTEN_DIGIT);

            expect(written.get("mask-image")).toBe("var(--digit-writer-mask, none)");
            expect(written.get("-webkit-mask-image")).toBe("var(--digit-writer-mask, none)");
        });

        // 黑板's digits are grained; while one is written both masks lie on it at once, so neither is lost
        it("should keep 黑板's grain on a digit while it is written, intersecting the two masks", () => {
            const written = declarationsOf(CHALKBOARD_CSS, DARK_WRITTEN_DIGIT);

            for (const property of ["mask-image", "-webkit-mask-image"]) {
                const [writerLayer, grainLayer] = (written.get(property) ?? "").split(/,\s*(?=var\(--chalkboard-grain)/);
                expect(writerLayer, property).toMatch(/^var\(--digit-writer-mask, /);
                expect(grainLayer, property).toBe(GRAIN);
            }
            // Without a writer (a digit placed while none is mounted) the first layer must still let the digit through
            expect(written.get("mask-image")).not.toContain("var(--digit-writer-mask, none)");
            expect(written.get("mask-size")).toBe("auto, 48px 48px");
            expect(written.get("-webkit-mask-size")).toBe("auto, 48px 48px");
            expect(written.get("mask-repeat")).toBe("no-repeat, repeat");
            expect(written.get("-webkit-mask-repeat")).toBe("no-repeat, repeat");
            expect(written.get("mask-composite")).toBe("intersect");
            expect(written.get("-webkit-mask-composite")).toBe("source-in");
        });

        it("should draw each stroke on along its length and settle the mask whole in 60ms", () => {
            const stroke = declarationsOf(CHALKBOARD_CSS, PEN_STROKE);
            const settle = declarationsOf(CHALKBOARD_CSS, PEN_SETTLE);

            expect(stroke.get("animation-name")).toBe("chalkboard-digit-stroke");
            expect(stroke.get("animation-fill-mode")).toBe("both");
            expect(keyframeEnds("chalkboard-digit-stroke").to.get("stroke-dashoffset")).toBe("0");
            expect(settle.get("opacity")).toBe("0");
            expect(settle.get("animation-name")).toBe("chalkboard-digit-settle");
            expect(settle.get("animation-duration")).toBe("60ms");
            expect(settle.get("animation-fill-mode")).toBe("both");
            expect(keyframeEnds("chalkboard-digit-settle").to.get("opacity")).toBe("1");
        });

        it("should stop the writing under reduced motion, showing the digit unmasked but for 黑板's grain", () => {
            expect(reducedMotionDeclarationsOf(PEN_STROKE).get("animation")).toBe("none");
            expect(reducedMotionDeclarationsOf(PEN_SETTLE).get("animation")).toBe("none");
            expect(reducedMotionDeclarationsOf(WRITTEN_DIGIT).get("mask-image")).toBe("none");
            expect(reducedMotionDeclarationsOf(WRITTEN_DIGIT).get("-webkit-mask-image")).toBe("none");
            expect(reducedMotionDeclarationsOf(DARK_WRITTEN_DIGIT).get("mask-image")).toBe(GRAIN);
            expect(reducedMotionDeclarationsOf(DARK_WRITTEN_DIGIT).get("-webkit-mask-image")).toBe(GRAIN);
            expect(reducedMotionDeclarationsOf(DARK_WRITTEN_DIGIT).get("mask-size")).toBe("48px 48px");
            expect(reducedMotionDeclarationsOf(DARK_WRITTEN_DIGIT).get("-webkit-mask-size")).toBe("48px 48px");
        });
    });

    describe("group completion", () => {
        it("should show its completed groups with chalk's group overlay", () => {
            expect(STYLE_MOMENTS.chalkboard.groupOverlay).toBeDefined();
        });

        it("should drag a line's chalk along it, hold it and fade it, as GroupChalk does", () => {
            const frames = framesOf("chalkboard-group-line");
            const dash = declarationsOf(CHALKBOARD_CSS, `${SCOPE} .chalkboard-group-stroke`);

            expect([...animatedPropertiesOf("chalkboard-group-line")].sort()).toEqual(["opacity", "stroke-dashoffset"]);
            // Unseen without its animation, so a stopped effect leaves no still cue
            expect(dash.get("opacity")).toBe("0");
            expect(dash.get("stroke-dashoffset")).toBe(dash.get("stroke-dasharray"));
            expect(frames[0]?.declarations.get("stroke-dashoffset")).toBe(dash.get("stroke-dasharray"));
            const drawnAt = frames.find(frame => frame.declarations.get("stroke-dashoffset") === "0")?.offsets[0] ?? 100;
            expect(drawnAt).toBeLessThan(50);
            expect(frames[frames.length - 1]?.declarations.get("opacity")).toBe("0");
            expect(frames[frames.length - 1]?.declarations.get("stroke-dashoffset")).toBe("0");
        });

        it("should draw a column's line as a row's, ring a box a beat later, and fade them all by about 0.9s", () => {
            const row = spanOf(GROUP_STROKE_OF.row, "chalkboard-group-line");
            const box = spanOf(GROUP_STROKE_OF.box, "chalkboard-group-line");

            expect(spanOf(GROUP_STROKE_OF.column, "chalkboard-group-line")).toEqual(row);
            expect(box.startMs).toBeGreaterThan(row.startMs);
            for (const span of [row, box]) {
                expect(span.endMs - span.startMs).toBeGreaterThanOrEqual(850);
                expect(span.endMs - span.startMs).toBeLessThanOrEqual(950);
            }
        });

        it("should drop three specks of dust off each line after it is drawn, in 黑板 only", () => {
            const drawn = spanOf(GROUP_STROKE_OF.row, "chalkboard-group-line");
            const dustStarts = DARK_GROUP_DUST_STEPS.map(selector => spanOf(selector, "chalkboard-group-dust").startMs);

            expect(dustStarts).toEqual([...dustStarts].sort((first, second) => first - second));
            expect(new Set(dustStarts).size).toBe(3);
            expect(dustStarts[0]).toBeGreaterThan(drawn.startMs);
            expect(declarationsOf(CHALKBOARD_CSS, GROUP_DUST).get("opacity")).toBe("0");
            expect([...animatedPropertiesOf("chalkboard-group-dust")].sort()).toEqual(["opacity", "transform"]);
            // 白板's marker drops none: only 黑板's rules animate the dust or give it a colour
            for (const { selector, declarations } of rulesMatching(/chalkboard-group-dust/)) {
                if (!declarations.has("animation") && !declarations.has("background-color")) continue;
                expect(selector.startsWith(DARK), selector).toBe(true);
            }
        });

        it("should grain the lines in 黑板 only, without a filter", () => {
            for (const { selector, declarations } of rulesMatching(/chalkboard-group/)) {
                expect(declarations.has("filter"), selector).toBe(false);
                if ([...declarations.values()].some(value => value.includes(GRAIN))) expect(selector.startsWith(DARK), selector).toBe(true);
            }
            const grained = rulesMatching(/chalkboard-group-line/).filter(({ declarations }) => declarations.get("mask-image") === GRAIN);
            expect(grained.map(({ selector }) => selector)).toEqual([`${DARK} .chalkboard-group-line > svg`]);
            expect(grained[0]?.declarations.get("-webkit-mask-image")).toBe(GRAIN);
        });

        it("should flash the group's digits in the primary chalk, rippling out 45ms a step", () => {
            const step = declarationsOf(CHALKBOARD_CSS, GROUP_CELL).get("--group-ripple-step") ?? "";
            const flash = declarationsOf(CHALKBOARD_CSS, GROUP_DIGIT).get("animation") ?? "";

            expect(Number.parseFloat(step)).toBe(45);
            expect(Number.parseFloat(step)).toBeLessThanOrEqual(GROUP_RIPPLE_STEP_MS);
            expect(flash).toContain("var(--group-delay");
            expect([...animatedPropertiesOf("chalkboard-group-flash")]).toEqual(["color"]);
            expect(framesOf("chalkboard-group-flash").some(frame => frame.declarations.get("color") === "var(--color-primary)")).toBe(true);
        });

        // The entered digit is in its own completed group (CLAUDE.md's trap). Chalk writes it through a mask, not
        // an animation, so the group's flash on it replaces nothing and the writing stays; and the flash is
        // named as a group's, so its end never settles the arrival while the pen is still drawing.
        it("should flash the entered digit too, without cutting its writing", () => {
            for (const { selector, declarations } of rulesMatching(/\.value-arrive/)) {
                expect(declarations.has("animation"), selector).toBe(false);
            }
            const group = declarationsOf(CHALKBOARD_CSS, GROUP_DIGIT);
            expect([...group.keys()].some(property => property.includes("mask"))).toBe(false);
            expect(group.get("animation")).toMatch(/^chalkboard-group-/);
        });

        it("should end each piece within the group effect", () => {
            const effectMs = STYLE_MOMENTS.chalkboard.groupEffectMs;

            // The entered cell's flash is the one that ends latest past its own ripple delay
            expect(spanOf(GROUP_DIGIT, "chalkboard-group-flash").endMs).toBeLessThanOrEqual(effectMs);
            const dustEnd = Math.max(...DARK_GROUP_DUST_STEPS.map(selector => spanOf(selector, "chalkboard-group-dust").endMs));
            // A line's farthest cell is at least four steps from the entered one, a box's two
            for (const kind of ["row", "column"] as const) {
                expect(Math.max(spanOf(GROUP_STROKE_OF[kind], "chalkboard-group-line").endMs, dustEnd), kind).toBeLessThanOrEqual(effectMs + 4 * GROUP_RIPPLE_STEP_MS);
            }
            expect(Math.max(spanOf(GROUP_STROKE_OF.box, "chalkboard-group-line").endMs, dustEnd)).toBeLessThanOrEqual(effectMs + 2 * GROUP_RIPPLE_STEP_MS);
        });

        // GroupChalk draws its lines in a layer over the board (z4), over the digits and the chalk lines, level with
        // the selection ring and after it, so over it too
        it("should lay the lines over the digits and the chalk lines, level with the selection ring", () => {
            const line = zIndexOf(GROUP_LINE);
            const grid = zIndexOf(`${SCOPE} [data-skin~="board-grid"]::after`);
            const ring = zIndexOf(`${BOARD}:not([data-hint-mode]) [data-selected]::after`);

            expect(zIndexOf(`${BOARD} [data-variant] > div`)).toBe(2);
            expect(grid).toBe(3);
            expect(line).toBeGreaterThan(grid);
            expect(line).toBe(ring);
            // Level with the ring, the overlay lies over it because it follows the cells
            const game = readFileSync("src/presentation/pages/game/GameScreen.vue", "utf8");
            expect(game.indexOf("<GroupOverlay")).toBeGreaterThan(game.indexOf("<Cell"));
            // Nothing lifts the group's cells into a layer of their own while the effect runs
            for (const { selector, declarations } of rulesMatching(/\[data-group\]/)) {
                expect(declarations.has("transform") || declarations.has("z-index") || declarations.has("isolation"), selector).toBe(false);
            }
        });

        it("should stop every piece under reduced motion and leave no still cue", () => {
            const animated = rulesMatching(/chalkboard-group|\[data-group\]/).filter(({ declarations }) => declarations.has("animation"));

            expect(animated.length).toBeGreaterThan(0);
            for (const { selector } of animated) {
                const stopped = reducedMotionDeclarationsOf(selector);
                expect(stopped.get("animation"), selector).toBe("none");
                expect([...stopped.keys()], selector).toEqual(["animation"]);
            }
        });
    });

    describe("chalk dust", () => {
        it("should drop each stroke end's dust in the board's chalk and let it fall away, in 黑板", () => {
            const dust = declarationsOf(CHALKBOARD_CSS, DARK_DUST);
            const { from, to } = keyframeEnds("chalkboard-digit-dust");

            expect(declarationsOf(CHALKBOARD_CSS, DUST).get("fill")).toBe("var(--color-foreground)");
            expect(dust.get("animation-name")).toBe("chalkboard-digit-dust");
            expect(dust.get("animation-fill-mode")).toBe("both");
            expect(from.get("opacity")).toBe("0");
            expect(to.get("opacity")).toBe("0");
            expect(to.get("transform")).toMatch(/^translate\(0, \d+px\)$/);
        });

        // The writer stays until its dust has fallen, so the last fall ends before the arrival would settle anyway
        it("should let the last dust fall before the arrival settles on its own", () => {
            const durationMs = Number.parseFloat(declarationsOf(CHALKBOARD_CSS, DARK_DUST).get("animation-duration") ?? "NaN");
            const lastFallMs = Math.max(...Object.values(CHALKBOARD_DIGIT_DUST).flatMap(falls => (falls ?? []).map(fall => fall.delayMs)));

            expect(lastFallMs + durationMs).toBeLessThan(ARRIVAL_SETTLE_MS);
        });

        // 白板 is markers: no dust (Review Focus 5)
        it("should drop no dust on 白板: hidden, and animated only in 黑板", () => {
            expect(declarationsOf(CHALKBOARD_CSS, DUST).get("opacity")).toBe("0");
            expect(declarationsOf(CHALKBOARD_CSS, DUST).has("animation")).toBe(false);
            expect(animatingSelectorsOf("chalkboard-digit-dust").every(selector => selector.startsWith(DARK))).toBe(true);
            expect(animatingSelectorsOf("chalkboard-digit-dust")).not.toEqual([]);
        });

        it("should drop no dust under reduced motion", () => {
            expect(reducedMotionDeclarationsOf(DARK_DUST).get("animation")).toBe("none");
        });
    });

    describe("loader", () => {
        it("should run every piece on one 5.2s infinite loop", () => {
            for (const piece of LOADER_PIECES) {
                expect(animationsOf(piece).length, piece).toBeGreaterThan(0);
            }
            for (const { selector, animation, name } of loaderAnimations()) {
                expect(animationTimingOf(animation, name)?.durationMs, selector).toBe(5200);
                expect(animation, selector).toMatch(/ infinite both$/);
            }
        });

        it("should start and end every round with each piece hidden, so the loop has no seam", () => {
            const dashLength = declarationsOf(CHALKBOARD_CSS, LOADER_STROKE).get("stroke-dasharray");

            expect(dashLength).toBeDefined();
            expect(declarationsOf(CHALKBOARD_CSS, LOADER_RING).get("stroke-dasharray")).toBe(dashLength);
            expect(declarationsOf(CHALKBOARD_CSS, LOADER_REVEAL).get("stroke-dasharray")).toBe(dashLength);
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
                    // A reveal: its mask is empty at the start of the round
                    expect(first.get("stroke-dashoffset"), name).toBe(dashLength);
                }
            }
        });

        it("should animate only opacity, transform and the dash offsets", () => {
            expect(loaderAnimations().length).toBeGreaterThan(0);
            for (const { name } of loaderAnimations()) {
                const properties = new Set(framesOf(name).flatMap(frame => [...frame.declarations.keys()]));

                expect([...properties].every(property => ["opacity", "transform", "stroke-dashoffset"].includes(property)), name).toBe(true);
            }
        });

        it("should chalk the 九宮 stroke by stroke, then ring and write each digit in turn, then wipe it", () => {
            const strokes = animationsOf(LOADER_STROKE).map(({ name }) => name);
            const rings = animationsOf(LOADER_RING).map(({ name }) => name);
            const digits = animationsOf(LOADER_DIGIT).map(({ name }) => name);
            const reveals = animationsOf(LOADER_REVEAL).map(({ name }) => name);
            const [duster] = animationsOf(LOADER_DUSTER);

            expect(strokes).toHaveLength(5);
            expect(digits).toHaveLength(4);
            expect(rings).toHaveLength(digits.length);
            expect(reveals).toHaveLength(digits.length);
            strokes.slice(1).forEach((stroke, position) => {
                expect(hiddenUntil(stroke), stroke).toBeGreaterThanOrEqual(wholeFrom(strokes[position], "stroke-dashoffset", "0"));
            });
            const lastStrokeDrawn = wholeFrom(strokes[strokes.length - 1], "stroke-dashoffset", "0");
            rings.forEach((ring, position) => {
                const previous = position === 0 ? lastStrokeDrawn : wholeFrom(reveals[position - 1], "stroke-dashoffset", "0");
                expect(hiddenUntil(ring), ring).toBeGreaterThanOrEqual(previous);
                // The digit is written once its ring is closed
                expect(hiddenUntil(digits[position]), digits[position]).toBeGreaterThanOrEqual(wholeFrom(ring, "stroke-dashoffset", "0"));
                expect(hiddenUntil(reveals[position]), reveals[position]).toBe(hiddenUntil(digits[position]));
            });
            expect(hiddenUntil(duster.name)).toBeGreaterThanOrEqual(wholeFrom(reveals[reveals.length - 1], "stroke-dashoffset", "0"));
        });

        // The canvas's wiper: the smudge is a soft band round the duster, dragged across with it
        it("should drag the smear across with the duster", () => {
            const [duster] = animationsOf(LOADER_DUSTER);
            const [smear] = animationsOf(LOADER_SMEAR);
            const travelOf = (name: string) => framesOf(name).map(frame => ({ offsets: frame.offsets, transform: frame.declarations.get("transform") }));

            expect(travelOf(smear.name)).toEqual(travelOf(duster.name));
        });

        // 白板 is markers: no dust, no grain and no blur (Review Focus 5)
        it("should drop no dust on 白板: hidden, and animated only in 黑板", () => {
            const dustSelectors = loaderAnimations().filter(({ selector }) => /chalkboard-loader-dust(?![\w-])/.test(selector)).map(({ selector }) => selector);

            expect(declarationsOf(CHALKBOARD_CSS, LOADER_DUST).get("opacity")).toBe("0");
            expect(declarationsOf(CHALKBOARD_CSS, LOADER_DUST).has("animation")).toBe(false);
            expect(dustSelectors).not.toEqual([]);
            expect(dustSelectors.every(selector => selector.startsWith(DARK))).toBe(true);
        });

        it("should grain the chalk only in 黑板, and blur nothing", () => {
            const grained: string[] = [];
            postcss.parse(CHALKBOARD_CSS).walkRules((rule) => {
                for (const selector of rule.selectors.map(collapse).filter(item => item.includes(".chalkboard-loader"))) {
                    rule.walkDecls((declaration) => {
                        expect(declaration.prop, selector).not.toBe("filter");
                        if (declaration.value.includes("--chalkboard-grain")) grained.push(selector);
                    });
                }
            });

            expect(grained).not.toEqual([]);
            expect(grained.every(selector => selector.startsWith(DARK))).toBe(true);
        });

        it("should hold the finished sketch under reduced motion: the 九宮, the digits, the last ring and one smear", () => {
            for (const { selector } of loaderAnimations()) {
                expect(reducedMotionDeclarationsOf(selector).get("animation"), selector).toBe("none");
            }
            const rings = animationsOf(LOADER_RING);
            const lastRing = rings[rings.length - 1].selector;

            expect(reducedMotionDeclarationsOf(LOADER_STROKE).get("opacity")).toBe("1");
            expect(reducedMotionDeclarationsOf(LOADER_STROKE).get("stroke-dashoffset")).toBe("0");
            expect(reducedMotionDeclarationsOf(LOADER_DIGIT).get("opacity")).toBe("1");
            expect(reducedMotionDeclarationsOf(LOADER_REVEAL).get("stroke-dashoffset")).toBe("0");
            expect(reducedMotionDeclarationsOf(LOADER_RING).get("opacity") ?? declarationsOf(CHALKBOARD_CSS, LOADER_RING).get("opacity")).toBe("0");
            expect(reducedMotionDeclarationsOf(lastRing).get("opacity")).toBe("1");
            expect(reducedMotionDeclarationsOf(lastRing).get("stroke-dashoffset")).toBe("0");
            expect(reducedMotionDeclarationsOf(LOADER_SMEAR).get("opacity")).toBe("1");
            // Left where the canvas's still frame leaves it, partway across
            expect(reducedMotionDeclarationsOf(LOADER_SMEAR).get("transform")).toBe("translateX(80px)");
            // The duster has gone; its dust has fallen
            expect(reducedMotionDeclarationsOf(LOADER_DUSTER).get("opacity") ?? declarationsOf(CHALKBOARD_CSS, LOADER_DUSTER).get("opacity")).toBe("0");
            expect(declarationsOf(CHALKBOARD_CSS, LOADER_DUST).get("opacity")).toBe("0");
        });

        // Loaders obey only the system's reduced motion, never the app's motion setting
        it("should not tie any loader rule to the motion setting", () => {
            const loaderSelectors: string[] = [];
            postcss.parse(CHALKBOARD_CSS).walkRules((rule) => {
                loaderSelectors.push(...rule.selectors.map(collapse).filter(selector => selector.includes(".chalkboard-loader")));
            });

            expect(loaderSelectors.length).toBeGreaterThan(0);
            for (const selector of loaderSelectors) {
                expect(selector).toMatch(/^(?::root\.dark)?\[data-style="chalkboard"\] \.chalkboard-loader[\w-]*(?:\[data-step="\d+"\])?$/);
            }
        });
    });
});
