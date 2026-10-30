import { readFileSync } from "fs";
import postcss, { type AtRule, type Declaration, type Rule } from "postcss";
import { AURORA_DENSITIES, AURORA_RIBBON, type AuroraDensity } from "@/style/styles/aurora/palette";
import type { ColorMode } from "@/theme/themeIds";
import { declarationsOf, findLayoutDeclarations, reducedMotionDeclarationsOf } from "../../styleSheetRules";
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

// The skin's density properties, each the palette's AURORA_DENSITIES fraction written as a percentage
const DENSITY_PROPERTIES: readonly (readonly [string, keyof AuroraDensity])[] = [
    ["--aurora-glass-card", "card"],
    ["--aurora-glass-cell", "cell"],
    ["--aurora-sheen-cell", "sheenCell"],
    ["--aurora-sheen-peer", "sheenPeer"],
    ["--aurora-glass-dialog", "dialog"],
    ["--aurora-tint-soft", "tintSoft"],
    ["--aurora-tint-same", "tintSame"],
    ["--aurora-error-wash", "errorWash"],
    ["--aurora-error-stripe", "errorStripe"],
];
// The glass's edge and gloss per mode, from the spec's table, and its shadow's strength, the canvas's --shadow
const EDGES: Readonly<Record<ColorMode, { edge: string; gloss: string; shadow: string }>> = {
    light: { edge: "85%", gloss: "90%", shadow: "12%" },
    dark: { edge: "12%", gloss: "14%", shadow: "35%" },
};
const MODE_ROOTS: Readonly<Record<ColorMode, string>> = { light: AURORA_LIGHT, dark: AURORA_DARK };

const percentOf = (value: string): number => {
    const match = /^(\d*\.?\d+)%$/.exec(value);
    if (match === null) throw new Error(`Not a percentage: "${value}"`);
    return Number(match[1]) / 100;
};

const BUTTON = skin("button");
const PRIMARY_BUTTON = `${BUTTON}:is(.bg-primary, .hint-primary)`;
const SECONDARY_BUTTON = `${BUTTON}:is(.bg-primary-light, .hint-secondary)`;
const OUTLINE_BUTTON = `${BUTTON}.bg-card`;
const DANGER_BUTTON = `${BUTTON}.bg-danger`;
const FLOATING_CARD = `${skin("card")}:is(.shadow-modal, .shadow-popup)`;
const soft = (token: string, amount: string): string => `color-mix(in srgb, var(--color-${token}) ${amount}, transparent)`;
const glow = (size: string, amount: string): string => `0 0 ${size} ${soft("primary", amount)}`;

describe("aurora's glass", () => {
    describe("its densities", () => {
        it.each(["light", "dark"] as const)("should give %s mode the palette's densities, edge and gloss", (mode) => {
            const root = MODE_ROOTS[mode];

            for (const [property, density] of DENSITY_PROPERTIES) {
                expect(percentOf(auroraProperty(root, property)), property).toBeCloseTo(AURORA_DENSITIES[mode][density], 6);
            }
            expect(auroraProperty(root, "--aurora-edge")).toBe(EDGES[mode].edge);
            expect(auroraProperty(root, "--aurora-gloss")).toBe(EDGES[mode].gloss);
            expect(auroraProperty(root, "--aurora-shadow")).toBe(EDGES[mode].shadow);
        });

        it("should veil the screen behind a dialog and the loader in the page colour, the same in both modes", () => {
            expect(auroraProperty(AURORA_SCOPE, "--aurora-scrim")).toBe("62%");
            expect(auroraProperty(AURORA_SCOPE, "--aurora-loader-scrim")).toBe("45%");
        });

        it("should make each pane a tint of the glass colour at its density, framed by an edge, a gloss and a shadow", () => {
            expect(auroraProperty(AURORA_SCOPE, "--aurora-glass-card-fill")).toBe(soft("glass", "var(--aurora-glass-card)"));
            expect(auroraProperty(AURORA_SCOPE, "--aurora-glass-dialog-fill")).toBe(soft("glass", "var(--aurora-glass-dialog)"));
            expect(auroraProperty(AURORA_SCOPE, "--aurora-glass-edge")).toBe(`inset 0 0 0 1px ${soft("glass-sheen", "var(--aurora-edge)")}`);
            expect(auroraProperty(AURORA_SCOPE, "--aurora-glass-frame")).toBe(
                `var(--aurora-glass-edge), inset 0 1px 0 ${soft("glass-sheen", "var(--aurora-gloss)")}, `
                + `0 10px 30px -12px ${soft("shadow", "var(--aurora-shadow)")}`,
            );
        });
    });

    describe("cards, dialogs and the toast", () => {
        it("should lay every card as glass at the card's density, rounded 22px", () => {
            const card = declarationsOf(AURORA_CSS, skin("card"));

            expect(card.get("background-color")).toBe("var(--aurora-glass-card-fill)");
            expect(card.get("box-shadow")).toBe("var(--aurora-glass-frame)");
            expect(card.get("border-radius")).toBe("22px");
        });

        it("should lay the dialogs and the hint menu at the denser dialog glass, as the board shows beneath them", () => {
            expect(declarationsOf(AURORA_CSS, FLOATING_CARD).get("background-color")).toBe("var(--aurora-glass-dialog-fill)");
        });

        it("should lay the toast as dialog glass, rounded 16px, in the text colour", () => {
            const toast = declarationsOf(AURORA_CSS, skin("toast"));

            expect(toast.get("background-color")).toBe("var(--aurora-glass-dialog-fill)");
            expect(toast.get("box-shadow")).toBe("var(--aurora-glass-edge)");
            expect(toast.get("border-radius")).toBe("16px");
            expect(toast.get("color")).toBe("var(--color-foreground)");
        });

        it("should veil the screen behind a dialog and the loader in the page colour, unblurred", () => {
            const dialogScrim = declarationsOf(AURORA_CSS, skin("dialog-scrim"));
            const loaderScrim = declarationsOf(AURORA_CSS, skin("loader-scrim"));

            expect(dialogScrim.get("background-color")).toBe(soft("background", "var(--aurora-scrim)"));
            expect(loaderScrim.get("background-color")).toBe(soft("background", "var(--aurora-loader-scrim)"));
        });

        it("should set dialog titles at 600 before and after the font loads, so only the face changes", () => {
            expect(declarationsOf(AURORA_CSS, skin("dialog-title")).get("font-weight")).toBe("600");
            expect(declarationsOf(AURORA_CSS, `${AURORA_SCOPE}[data-aurora-fonts="ready"] [data-skin~="dialog-title"]`).has("font-weight")).toBe(false);
        });

        it("should round the hint menu's options 14px, draw their icons in the primary and its divider in a faint line of the text colour", () => {
            expect(declarationsOf(AURORA_CSS, skin("menu-option")).get("border-radius")).toBe("14px");
            expect(declarationsOf(AURORA_CSS, `${skin("menu-option")} > svg`).get("color")).toBe("var(--color-primary)");
            expect(declarationsOf(AURORA_CSS, skin("menu-divider")).get("background-color")).toBe(soft("foreground", "12%"));
        });
    });

    describe("buttons", () => {
        it("should round every button 16px", () => {
            expect(declarationsOf(AURORA_CSS, BUTTON).get("border-radius")).toBe("16px");
        });

        it("should fill a main button with the primary, lit by a soft glow of it and a gloss along its top", () => {
            const button = declarationsOf(AURORA_CSS, PRIMARY_BUTTON);

            expect(button.get("background-color")).toBe("var(--color-primary)");
            expect(button.get("color")).toBe("var(--color-on-primary)");
            expect(button.get("box-shadow")).toBe(`0 8px 24px -8px ${soft("primary", "75%")}, inset 0 1px 0 ${soft("glass-sheen", "35%")}`);
        });

        it("should lay a secondary button in the soft tint of the primary, written in the primary", () => {
            const button = declarationsOf(AURORA_CSS, SECONDARY_BUTTON);

            expect(button.get("background-color")).toBe(soft("primary", "var(--aurora-tint-soft)"));
            expect(button.get("color")).toBe("var(--color-primary)");
            expect(button.get("box-shadow")).toBe("none");
        });

        // The sheen's rim alone would vanish on 晨光's near-solid dialog glass
        it("should make an outlined button a pane of glass in a faint line of the text colour", () => {
            const button = declarationsOf(AURORA_CSS, OUTLINE_BUTTON);

            expect(button.get("background-color")).toBe("var(--aurora-glass-card-fill)");
            expect(button.get("border-color")).toBe("transparent");
            expect(button.get("box-shadow")).toBe(`inset 0 0 0 1px ${soft("foreground", "12%")}`);
        });

        it("should fill the danger button with the error colour, written in on-danger", () => {
            const button = declarationsOf(AURORA_CSS, DANGER_BUTTON);

            expect(button.get("background-color")).toBe("var(--color-error)");
            expect(button.get("color")).toBe("var(--color-on-danger)");
            expect(button.get("box-shadow")).toBe("none");
        });

        it("should write a button that is only its words in the secondary text colour, unless it is a danger one", () => {
            const plain = `${skin("text-button")}:not(.text-danger)`;

            for (const selector of [plain, `${plain} > span`]) {
                expect(declarationsOf(AURORA_CSS, selector).get("color")).toBe("var(--color-foreground-secondary)");
            }
            expect(declarationsOf(AURORA_CSS, skin("text-button")).get("border-radius")).toBe("16px");
        });
    });

    describe("icon tiles, pills and tags", () => {
        it("should lay an icon tile in the soft tint under the primary, glowing 30px", () => {
            const tile = declarationsOf(AURORA_CSS, skin("icon-tile"));

            expect(tile.get("background-color")).toBe(soft("primary", "var(--aurora-tint-soft)"));
            expect(tile.get("color")).toBe("var(--color-primary)");
            expect(tile.get("box-shadow")).toBe(glow("30px", "35%"));
            expect(declarationsOf(AURORA_CSS, `${skin("icon-tile")} > svg`).get("color")).toBe("inherit");
        });

        it("should lay a danger icon tile in 14% of the error colour under it, keeping the glow", () => {
            const tile = declarationsOf(AURORA_CSS, `${skin("icon-tile")}[data-skin~="danger"]`);

            expect(tile.get("background-color")).toBe(soft("error", "14%"));
            expect(tile.get("color")).toBe("var(--color-error)");
            expect(tile.has("box-shadow")).toBe(false);
        });

        it("should make the header's pill round glass in the text colour, and the hint pill solid primary", () => {
            const pill = declarationsOf(AURORA_CSS, skin("pill"));
            const hint = declarationsOf(AURORA_CSS, `${skin("pill")}[data-skin~="hint"]`);

            expect(pill.get("background-color")).toBe("var(--aurora-glass-card-fill)");
            expect(pill.get("box-shadow")).toBe("var(--aurora-glass-frame)");
            expect(pill.get("border-radius")).toBe("9999px");
            expect(pill.get("color")).toBe("var(--color-foreground)");
            expect(declarationsOf(AURORA_CSS, `${skin("pill")} > span`).get("color")).toBe("inherit");
            expect(hint.get("background-color")).toBe("var(--color-primary)");
            expect(hint.get("color")).toBe("var(--color-on-primary)");
        });

        it("should lay a tag in the soft tint under the text colour, and stamp a new record solid primary with a 16px glow", () => {
            const tag = declarationsOf(AURORA_CSS, skin("tag"));
            const record = declarationsOf(AURORA_CSS, `${skin("tag")}[data-skin~="new-record"]`);

            expect(tag.get("background-color")).toBe(soft("primary", "var(--aurora-tint-soft)"));
            expect(tag.get("color")).toBe("var(--color-foreground)");
            expect(record.get("background-color")).toBe("var(--color-primary)");
            expect(record.get("color")).toBe("var(--color-on-primary)");
            expect(record.get("box-shadow")).toBe(glow("16px", "55%"));
        });

        it("should lay a step's tag in the soft tint under the primary, and a final step's solid with a glow", () => {
            const step = declarationsOf(AURORA_CSS, `${skin("tag")}[data-skin~="step"]`);
            const strong = declarationsOf(AURORA_CSS, `${skin("tag")}[data-skin~="step"][data-skin~="strong"]`);

            expect(step.get("background-color")).toBe(soft("primary", "var(--aurora-tint-soft)"));
            expect(step.get("color")).toBe("var(--color-primary)");
            expect(strong.get("background-color")).toBe("var(--color-primary)");
            expect(strong.get("color")).toBe("var(--color-on-primary)");
            expect(strong.get("box-shadow")).toBe(glow("16px", "50%"));
        });

        it("should lay the changelog's App tag in the soft tint under the primary", () => {
            const tag = declarationsOf(AURORA_CSS, skin("app-tag"));

            expect(tag.get("background-color")).toBe(soft("primary", "var(--aurora-tint-soft)"));
            expect(tag.get("color")).toBe("var(--color-primary)");
        });
    });

    describe("words on the lights", () => {
        // Nothing but the text colour reads 4.5:1 where the lights are brightest (spec ruling 4)
        it("should write the timer's icon and the changelog's note in the text colour", () => {
            expect(declarationsOf(AURORA_CSS, `${AURORA_SCOPE} svg.lucide-timer`).get("color")).toBe("var(--color-foreground)");
            expect(declarationsOf(AURORA_CSS, `${AURORA_SCOPE} [data-testid="changelog-app-note"]`).get("color")).toBe("var(--color-foreground)");
        });

        it.each([
            "src/presentation/components/page-header/PageHeader.vue",
            "src/presentation/pages/game/components/GameHeader.vue",
        ])("should leave %s's back button, title and timer in the text colour", (path) => {
            const header = readFileSync(path, "utf8");
            const spans = [...header.matchAll(/<span\s+class="([^"]*)"/g)].map(match => match[1]);

            expect(spans.join(" ")).not.toMatch(/\btext-foreground-(?:secondary|muted)\b/);
        });

        it("should draw line icons 2 wide with round ends and joins", () => {
            const icons = declarationsOf(AURORA_CSS, `${AURORA_SCOPE} svg.lucide`);

            expect(icons.get("stroke-width")).toBe("2");
            expect(icons.get("stroke-linecap")).toBe("round");
            expect(icons.get("stroke-linejoin")).toBe("round");
        });
    });

    describe("Home", () => {
        const DOT = (color: string): string => `radial-gradient(circle, ${color} 0, ${color} 5px, transparent 5.5px)`;
        const DARK_SKIN = (token: string): string => `${AURORA_DARK} [data-skin~="${token}"]`;

        it("should make the logo a round pane of glass glowing in the primary", () => {
            const logo = declarationsOf(AURORA_CSS, skin("logo"));

            expect(logo.get("border-radius")).toBe("50%");
            expect(logo.get("background-color")).toBe("var(--aurora-glass-card-fill)");
            expect(logo.get("box-shadow")).toBe(`var(--aurora-glass-frame), 0 0 40px ${soft("primary", "35%")}`);
        });

        it("should draw the logo's nine squares as dots, the odd ones in the primary and the rest faint, sized by the markup alone", () => {
            const squares = declarationsOf(AURORA_CSS, `${skin("logo")} > * > *`);
            const odd = declarationsOf(AURORA_CSS, `${skin("logo")} > * > :nth-child(odd)`);

            expect(squares.get("background-color")).toBe("transparent");
            expect(squares.get("background-image")).toBe(DOT(soft("foreground", "25%")));
            expect(odd.get("background-image")).toBe(DOT("var(--color-primary)"));
            expect([...squares.keys(), ...odd.keys()].filter(property => /^(width|height)$/.test(property))).toEqual([]);
        });

        it("should set the title at 600 whether or not the faces are ready, and the subtitle in the text colour", () => {
            expect(declarationsOf(AURORA_CSS, skin("title")).get("font-weight")).toBe("600");
            expect(declarationsOf(AURORA_CSS, `${AURORA_SCOPE}[data-aurora-fonts="ready"] [data-skin~="title"]`).has("font-weight")).toBe(false);
            expect(declarationsOf(AURORA_CSS, `${AURORA_SCOPE} [data-testid="home-hero"] > p`).get("color")).toBe("var(--color-foreground)");
        });

        it("should light the continue button from beneath in the primary, written in on-primary, with a gloss along its top", () => {
            const button = declarationsOf(AURORA_CSS, skin("continue"));

            expect(button.get("background-color")).toBe("var(--color-primary)");
            expect(button.get("color")).toBe("var(--color-on-primary)");
            expect(button.get("box-shadow")).toBe(`0 14px 34px -12px ${soft("primary", "70%")}, inset 0 1px 0 ${soft("glass-sheen", "35%")}`);
        });

        it("should set a chip in Outfit at 500, the face only once the faces are ready", () => {
            expect(declarationsOf(AURORA_CSS, skin("chip")).get("font-weight")).toBe("500");
            expect(declarationsOf(AURORA_CSS, `${AURORA_SCOPE}[data-aurora-fonts="ready"] [data-skin~="chip"]`).get("font-family")).toBe("var(--font-aurora-sans)");
        });

        it("should tint a chip with 16% of the text colour over the primary in 晨光 and of on-primary in 夜空, written in on-primary", () => {
            expect(declarationsOf(AURORA_CSS, skin("chip")).get("background-color"))
                .toBe("color-mix(in srgb, var(--color-foreground) 16%, var(--color-primary))");
            expect(declarationsOf(AURORA_CSS, skin("chip")).get("color")).toBe("var(--color-on-primary)");
            expect(declarationsOf(AURORA_CSS, DARK_SKIN("chip")).get("background-color")).toBe(soft("on-primary", "16%"));
        });

        it("should lay the difficulty strip in 7% of the text colour, its chosen segment a brighter pane of glass with a shadow", () => {
            const strip = declarationsOf(AURORA_CSS, skin("segmented"));
            const chosen = declarationsOf(AURORA_CSS, skin("segmented-indicator"));

            expect(strip.get("background-color")).toBe(soft("foreground", "7%"));
            expect(strip.get("box-shadow")).toBe("none");
            expect(chosen.get("background-color")).toBe("var(--color-glass-sheen)");
            expect(chosen.get("box-shadow")).toBe(`0 2px 8px -2px ${soft("shadow", "var(--aurora-shadow)")}`);
            expect(declarationsOf(AURORA_CSS, `${AURORA_DARK} [data-skin~="segmented-indicator"]`).get("background-color"))
                .toBe(soft("glass-sheen", "var(--aurora-gloss)"));
            expect(declarationsOf(AURORA_CSS, `${skin("segment")}[aria-pressed="true"]`).get("color")).toBe("var(--color-foreground)");
        });

        it("should lay Home's tiles as card glass with their icons in the primary", () => {
            const tile = declarationsOf(AURORA_CSS, skin("home-tile"));

            expect(tile.get("background-color")).toBe("var(--aurora-glass-card-fill)");
            expect(tile.get("box-shadow")).toBe("var(--aurora-glass-frame)");
            expect(declarationsOf(AURORA_CSS, `${skin("home-tile")} > svg`).get("color")).toBe("var(--color-primary)");
        });
    });

    it("should change no layout outside the pseudo-elements", () => {
        expect(findLayoutDeclarations(AURORA_CSS)).toEqual([]);
    });
});

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
