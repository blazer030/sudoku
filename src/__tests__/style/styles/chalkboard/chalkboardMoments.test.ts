import { readFileSync } from "fs";
import postcss from "postcss";
import { ARRIVAL_SETTLE_MS } from "@/presentation/components/board-cell/useArrivalMotion";
import { CHALKBOARD_DIGIT_DUST } from "@/presentation/components/style-moments/chalkboard/chalkboardDigitStrokes";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
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
