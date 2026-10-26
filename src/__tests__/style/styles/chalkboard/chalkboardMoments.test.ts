import { readFileSync } from "fs";
import postcss from "postcss";
import { ARRIVAL_SETTLE_MS } from "@/presentation/components/board-cell/useArrivalMotion";
import { CHALKBOARD_DIGIT_DUST } from "@/presentation/components/style-moments/chalkboard/chalkboardDigitStrokes";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import ChalkboardDigitWriter from "@/presentation/components/style-moments/chalkboard/ChalkboardDigitWriter.vue";
import { declarationsOf, reducedMotionDeclarationsOf as reducedMotionDeclarationsIn } from "../../styleSheetRules";

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
});
