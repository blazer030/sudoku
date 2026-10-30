import postcss, { type AtRule, type Declaration, type Rule } from "postcss";
import { AURORA_DENSITIES, AURORA_RIBBON } from "@/style/styles/aurora/palette";
import { declarationsOf, reducedMotionDeclarationsOf } from "../../styleSheetRules";
import { AURORA_CSS, AURORA_DARK, AURORA_LIGHT, AURORA_SCOPE, auroraProperty, vmaxOf } from "./auroraSheet";

const BODY = `${AURORA_SCOPE} body`;
// a1 and a3 drift together on one layer, a2 and a4 on another, and the ribbon on a third
const FIRST_LIGHTS = `${BODY}::before`;
const SECOND_LIGHTS = `${BODY}::after`;
const RIBBON = `${AURORA_SCOPE} .app-safe-area::before`;
const LAYERS = [FIRST_LIGHTS, SECOND_LIGHTS, RIBBON];
const skin = (token: string): string => `${AURORA_SCOPE} [data-skin~="${token}"]`;

const blob = (light: number): string => `radial-gradient(circle, var(--color-aurora-${light}) 0, transparent 66%)`;
const fromOverscan = (property: string): string => `calc(var(--aurora-overscan) + var(${property}))`;

// The keyframes called `name`: each step's selector and its declarations
const keyframesOf = (name: string): { step: string; declarations: Map<string, string> }[] => {
    const steps: { step: string; declarations: Map<string, string> }[] = [];
    postcss.parse(AURORA_CSS).walkAtRules(/keyframes$/, (atRule: AtRule) => {
        if (atRule.params.trim() !== name) return;
        atRule.walkRules((rule: Rule) => {
            const declarations = new Map<string, string>();
            rule.walkDecls((declaration) => {
                declarations.set(declaration.prop, declaration.value.replace(/\s+/g, " ").trim());
            });
            steps.push({ step: rule.selector, declarations });
        });
    });
    return steps;
};

// The six windows the lights must keep apart in, phones to a wide desktop
const VIEWPORTS: readonly (readonly [number, number])[] = [[360, 640], [360, 800], [390, 844], [768, 1024], [1280, 800], [1920, 1080]];

type Point = readonly [number, number];

const geometry = (name: string): number => vmaxOf(auroraProperty(AURORA_SCOPE, name));

// Each light's centre in vmax, measured from the window's top left: a light's square sits its x and y away from
// the two edges it is anchored to (a1 top left, a3 bottom left, a2 top right, a4 bottom right)
const centresIn = (widthPx: number, heightPx: number): Record<"a1" | "a2" | "a3" | "a4", Point> => {
    const vmaxPx = Math.max(widthPx, heightPx) / 100;
    const width = widthPx / vmaxPx;
    const height = heightPx / vmaxPx;
    const half = geometry("--aurora-blob-size") / 2;
    const x = (light: string): number => geometry(`--aurora-${light}-x`);
    const y = (light: string): number => geometry(`--aurora-${light}-y`);
    return {
        a1: [x("a1") + half, y("a1") + half],
        a3: [x("a3") + half, height - y("a3") - half],
        a2: [width - x("a2") - half, y("a2") + half],
        a4: [width - x("a4") - half, height - y("a4") - half],
    };
};

const distance = (from: Point, to: Point): number => Math.hypot(from[0] - to[0], from[1] - to[1]);

const driftOf = (layer: 1 | 2): number => Math.hypot(geometry(`--aurora-drift-${layer}-x`), geometry(`--aurora-drift-${layer}-y`));

describe("aurora skin", () => {
    describe("the page", () => {
        it("should lay the page colour on the body alone, with no picture of its own", () => {
            const body = declarationsOf(AURORA_CSS, BODY);

            expect(body.get("background-color")).toBe("var(--color-background)");
            expect(body.has("background-image")).toBe(false);
        });

        it("should leave the page scroller, the pages and their headers clear, so the lights show through", () => {
            for (const token of ["page", "page-ruled", "page-header"]) {
                expect(declarationsOf(AURORA_CSS, skin(token)).get("background-color")).toBe("transparent");
            }
        });

        it("should lay the page colour over a scrolled header as it scrolls, with no frosting", () => {
            const header = declarationsOf(AURORA_CSS, `${skin("page-header")}[data-scrolled]`);

            expect(header.get("background-color")).toBe("color-mix(in srgb, var(--color-background) calc(88% * var(--header-scroll, 0)), transparent)");
            expect(header.has("backdrop-filter")).toBe(false);
            expect(header.has("-webkit-backdrop-filter")).toBe(false);
        });
    });

    describe("the lights", () => {
        it.each(LAYERS)("should fix %s to the window, below every content layer, never taking taps, on a layer of its own", (layer) => {
            const declarations = declarationsOf(AURORA_CSS, layer);

            expect(declarations.get("content")).toBe('""');
            expect(declarations.get("position")).toBe("fixed");
            expect(declarations.get("z-index")).toBe("-1");
            expect(declarations.get("pointer-events")).toBe("none");
            expect(declarations.get("will-change")).toBe("transform");
        });

        it("should give each light the mode's strength, the same as the palette's", () => {
            expect(auroraProperty(AURORA_LIGHT, "--aurora-strength")).toBe(String(AURORA_DENSITIES.light.strength));
            expect(auroraProperty(AURORA_DARK, "--aurora-strength")).toBe(String(AURORA_DENSITIES.dark.strength));
            expect(Number.parseFloat(auroraProperty(AURORA_SCOPE, "--aurora-ribbon-first")) / 100).toBeCloseTo(AURORA_RIBBON.first, 6);
            expect(Number.parseFloat(auroraProperty(AURORA_SCOPE, "--aurora-ribbon-second")) / 100).toBeCloseTo(AURORA_RIBBON.second, 6);
            expect(auroraProperty(AURORA_SCOPE, "--aurora-ribbon-strength")).toBe(String(AURORA_RIBBON.strength));
            for (const layer of [FIRST_LIGHTS, SECOND_LIGHTS]) {
                expect(declarationsOf(AURORA_CSS, layer).get("opacity")).toBe("var(--aurora-strength)");
            }
            expect(declarationsOf(AURORA_CSS, RIBBON).get("opacity")).toBe("calc(var(--aurora-strength) * var(--aurora-ribbon-strength))");
        });

        it("should draw a1 at the top left and a3 at the bottom left on the first layer, as soft-edged gradients", () => {
            const layer = declarationsOf(AURORA_CSS, FIRST_LIGHTS);

            expect(layer.get("background-image")).toBe(`${blob(1)}, ${blob(3)}`);
            expect(layer.get("background-size")).toBe("var(--aurora-blob-size) var(--aurora-blob-size)");
            expect(layer.get("background-repeat")).toBe("no-repeat");
            expect(layer.get("background-position")).toBe(
                `left ${fromOverscan("--aurora-a1-x")} top ${fromOverscan("--aurora-a1-y")}, `
                + `left ${fromOverscan("--aurora-a3-x")} bottom ${fromOverscan("--aurora-a3-y")}`,
            );
        });

        it("should draw a2 at the top right and a4 at the bottom right on the second layer", () => {
            const layer = declarationsOf(AURORA_CSS, SECOND_LIGHTS);

            expect(layer.get("background-image")).toBe(`${blob(2)}, ${blob(4)}`);
            expect(layer.get("background-size")).toBe("var(--aurora-blob-size) var(--aurora-blob-size)");
            expect(layer.get("background-repeat")).toBe("no-repeat");
            expect(layer.get("background-position")).toBe(
                `right ${fromOverscan("--aurora-a2-x")} top ${fromOverscan("--aurora-a2-y")}, `
                + `right ${fromOverscan("--aurora-a4-x")} bottom ${fromOverscan("--aurora-a4-y")}`,
            );
        });

        it("should overhang the window by more than either drift, so a drifting layer never shows its edge", () => {
            const overscan = geometry("--aurora-overscan");

            for (const layer of [FIRST_LIGHTS, SECOND_LIGHTS]) {
                expect(declarationsOf(AURORA_CSS, layer).get("inset")).toBe("calc(-1 * var(--aurora-overscan))");
            }
            for (const drift of [1, 2]) {
                expect(overscan).toBeGreaterThanOrEqual(Math.abs(geometry(`--aurora-drift-${drift}-x`)));
                expect(overscan).toBeGreaterThanOrEqual(Math.abs(geometry(`--aurora-drift-${drift}-y`)));
            }
        });

        it("should draw the ribbon as two ellipses, a1 on the left and a2 on the right, tilted at rest", () => {
            const ribbon = declarationsOf(AURORA_CSS, RIBBON);
            const image = ribbon.get("background-image") ?? "";

            expect(image.match(/radial-gradient\(ellipse /g)).toHaveLength(2);
            expect(image.indexOf("color-mix(in srgb, var(--color-aurora-1) var(--aurora-ribbon-first), transparent)"))
                .toBeLessThan(image.indexOf("color-mix(in srgb, var(--color-aurora-2) var(--aurora-ribbon-second), transparent)"));
            expect(image).not.toContain("linear-gradient");
            expect(ribbon.get("transform")).toBe("rotate(-12deg)");
        });

        // The contrast model takes the brightest point as one light's core: no two cores ever meet
        it.each(VIEWPORTS)("should keep every two lights' cores a fade radius apart in a %ix%i window", (width, height) => {
            const fadeRadius = 0.66 * geometry("--aurora-blob-size") * Math.SQRT2 / 2;
            const centres = centresIn(width, height);
            const drifts = driftOf(1) + driftOf(2);

            expect(distance(centres.a1, centres.a3)).toBeGreaterThanOrEqual(fadeRadius);
            expect(distance(centres.a2, centres.a4)).toBeGreaterThanOrEqual(fadeRadius);
            for (const first of [centres.a1, centres.a3]) {
                for (const second of [centres.a2, centres.a4]) {
                    expect(distance(first, second) - drifts).toBeGreaterThanOrEqual(fadeRadius);
                }
            }
        });
    });

    describe("the drift", () => {
        it("should drift the two layers on their own paths and swing the ribbon", () => {
            expect(declarationsOf(AURORA_CSS, FIRST_LIGHTS).get("animation")).toBe("aurora-drift-first 19s ease-in-out infinite alternate");
            expect(declarationsOf(AURORA_CSS, SECOND_LIGHTS).get("animation")).toBe("aurora-drift-second 23s ease-in-out infinite alternate-reverse");
            expect(declarationsOf(AURORA_CSS, RIBBON).get("animation")).toBe("aurora-ribbon 16s ease-in-out infinite alternate");
        });

        it("should move each layer only by translating it, never scaling it", () => {
            for (const [name, layer] of [["aurora-drift-first", 1], ["aurora-drift-second", 2]] as const) {
                const steps = keyframesOf(name);

                expect(steps.map(step => step.step)).toEqual(["to"]);
                expect([...steps[0].declarations.keys()]).toEqual(["transform"]);
                expect(steps[0].declarations.get("transform")).toBe(`translate(var(--aurora-drift-${layer}-x), var(--aurora-drift-${layer}-y))`);
            }
        });

        it("should swing the ribbon from -12deg to -4deg by its transform alone", () => {
            const steps = keyframesOf("aurora-ribbon");

            expect(steps.map(step => [step.step, [...step.declarations.entries()]])).toEqual([
                ["from", [["transform", "rotate(-12deg)"]]],
                ["to", [["transform", "rotate(-4deg)"]]],
            ]);
        });

        it.each(LAYERS)("should hold %s still where it starts under reduced motion", (layer) => {
            const still = reducedMotionDeclarationsOf(AURORA_CSS, layer);

            expect(still.get("animation")).toBe("none");
            expect(still.has("transform")).toBe(false);
        });
    });

    describe("what the style never uses", () => {
        it("should use no filter, no :has(), no offset path and no mask by reference anywhere", () => {
            const root = postcss.parse(AURORA_CSS);
            const banned: string[] = [];
            root.walkDecls((declaration: Declaration) => {
                const property = declaration.prop.toLowerCase();
                if (["filter", "backdrop-filter", "-webkit-backdrop-filter", "offset-path"].includes(property)) banned.push(property);
                if (declaration.value.includes("url(#")) banned.push(`${property}: ${declaration.value}`);
            });
            root.walkRules((rule: Rule) => {
                if (rule.selector.includes(":has(")) banned.push(rule.selector);
            });

            expect(banned).toEqual([]);
        });
    });
});
