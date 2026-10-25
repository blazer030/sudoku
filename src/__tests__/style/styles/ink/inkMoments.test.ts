import { readFileSync } from "fs";
import postcss, { type AtRule } from "postcss";
import { animationTimingOf, declarationsOf, reducedMotionDeclarationsOf as reducedMotionDeclarationsIn } from "../../styleSheetRules";

const INK_CSS = readFileSync("src/style/styles/ink/skin.css", "utf8");

const SCOPE = '[data-style="ink"]';
const STROKE = `${SCOPE} .ink-loader-stroke`;
const REVEAL = `${SCOPE} .ink-loader-reveal`;
const DIGIT = `${SCOPE} .ink-loader-digit`;
const SEAL = `${SCOPE} .ink-loader-seal`;
const PIECES = [STROKE, REVEAL, DIGIT, SEAL];

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

describe("ink moments", () => {
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
