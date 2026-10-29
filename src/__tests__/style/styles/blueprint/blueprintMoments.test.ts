import { readFileSync } from "fs";
import postcss from "postcss";
import { ARRIVAL_SETTLE_MS } from "@/presentation/components/board-cell/useArrivalMotion";
import { animationTimingOf, declarationsOf, reducedMotionDeclarationsOf } from "../../styleSheetRules";

const BLUEPRINT_CSS = readFileSync("src/style/styles/blueprint/skin.css", "utf8");

const SCOPE = '[data-style="blueprint"]';
const BOARD = `${SCOPE} [data-skin~="board"]`;

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
});
