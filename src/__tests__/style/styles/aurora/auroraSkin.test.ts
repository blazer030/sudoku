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

// Each light eases out like a blur, without a filter: its full colour at the core, then these shares of it at these
// points of its fade, then nothing (a Gaussian's 100, 75, 40 and 13 per cent), so it has no cone's hard tip
const FALLOFF: readonly (readonly [share: number, at: number])[] = [[75, 16], [40, 30], [13, 45]];
const FADE_END = 66;
const fading = (colour: string, scale: number): string => FALLOFF
    .map(([share, at]) => `color-mix(in srgb, ${colour} ${share}%, transparent) ${Math.round(at * scale)}%`).join(", ");
const blob = (light: number): string => `radial-gradient(circle, var(--color-aurora-${light}) 0, ${fading(`var(--color-aurora-${light})`, 1)}, transparent ${FADE_END}%)`;
// The ribbon's ellipses fade over their whole size, so the same falloff is stretched from 66 to 100
const ribbonLight = (at: string, colour: string): string => `radial-gradient(ellipse 24% 50% at ${at}, ${colour} 0, ${fading(colour, 100 / FADE_END)}, transparent 100%)`;
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
// The glass's cues per mode: its all-round edge, the brighter rim along its top and left, the gentle highlight just
// inside its edge and the sheen over its top, the gloss of the chosen segment, and its shadow's strength (the canvas's
// --shadow). They read as glass without a filter.
const EDGES: Readonly<Record<ColorMode, Record<"edge" | "rim" | "inner" | "pane-sheen" | "gloss" | "shadow", string>>> = {
    light: { "edge": "70%", "rim": "100%", "inner": "50%", "pane-sheen": "30%", "gloss": "90%", "shadow": "12%" },
    dark: { "edge": "10%", "rim": "32%", "inner": "8%", "pane-sheen": "4%", "gloss": "14%", "shadow": "35%" },
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
// Where a rule with this exact selector stands in the sheet: the later of two equally specific rules wins
const ruleOrder = (selector: string): number => {
    let order = -1;
    let position = 0;
    postcss.parse(AURORA_CSS).walkRules((rule: Rule) => {
        position += 1;
        if (rule.selectors.map(item => item.replace(/\s+/g, " ").trim()).join(", ") === selector) order = position;
    });
    return order;
};
const glow = (size: string, amount: string): string => `0 0 ${size} ${soft("primary", amount)}`;

describe("aurora's glass", () => {
    describe("its densities", () => {
        it.each(["light", "dark"] as const)("should give %s mode the palette's densities and the glass's cues", (mode) => {
            const root = MODE_ROOTS[mode];

            for (const [property, density] of DENSITY_PROPERTIES) {
                expect(percentOf(auroraProperty(root, property)), property).toBeCloseTo(AURORA_DENSITIES[mode][density], 6);
            }
            for (const [cue, value] of Object.entries(EDGES[mode])) {
                expect(auroraProperty(root, `--aurora-${cue}`), cue).toBe(value);
            }
        });

        it("should lay 晨光's dialogs fully opaque, so no digit shows through, and leave 夜空's at 97%", () => {
            expect(percentOf(auroraProperty(AURORA_LIGHT, "--aurora-glass-dialog"))).toBe(1);
            expect(percentOf(auroraProperty(AURORA_DARK, "--aurora-glass-dialog"))).toBe(0.97);
        });

        it("should veil the screen behind a dialog and the loader in the page colour, the same in both modes", () => {
            expect(auroraProperty(AURORA_SCOPE, "--aurora-scrim")).toBe("62%");
            expect(auroraProperty(AURORA_SCOPE, "--aurora-loader-scrim")).toBe("45%");
        });

        it("should make each pane a tint of the glass colour at its density, framed by an edge, a rim, a highlight and a shadow", () => {
            expect(auroraProperty(AURORA_SCOPE, "--aurora-glass-card-fill")).toBe(soft("glass", "var(--aurora-glass-card)"));
            expect(auroraProperty(AURORA_SCOPE, "--aurora-glass-dialog-fill")).toBe(soft("glass", "var(--aurora-glass-dialog)"));
            expect(auroraProperty(AURORA_SCOPE, "--aurora-glass-edge")).toBe(`inset 0 0 0 1px ${soft("glass-sheen", "var(--aurora-edge)")}`);
            expect(auroraProperty(AURORA_SCOPE, "--aurora-glass-frame")).toBe(
                `var(--aurora-glass-edge), inset 1px 1px 0 ${soft("glass-sheen", "var(--aurora-rim)")}, `
                + `inset 0 0 20px -8px ${soft("glass-sheen", "var(--aurora-inner)")}, `
                + `0 10px 30px -12px ${soft("shadow", "var(--aurora-shadow)")}`,
            );
        });

        // The contrast model checks the words on a pane under this sheen's brightest point too
        it("should lay a sheen over the top of each pane, from the pane sheen at its top left to nothing by 45%", () => {
            expect(auroraProperty(AURORA_SCOPE, "--aurora-glass-sheen-fill"))
                .toBe(`linear-gradient(160deg, ${soft("glass-sheen", "var(--aurora-pane-sheen)")} 0, transparent 45%)`);
        });

        it.each(["card", "pill", "key", "home-tile", "recent-row", "logo"])("should lay the sheen on a %s's glass", (token) => {
            expect(declarationsOf(AURORA_CSS, skin(token)).get("background-image")).toBe("var(--aurora-glass-sheen-fill)");
        });

        it("should lay the sheen on a control that is on, and none on the solid primary of the hint pill or a lit key", () => {
            expect(declarationsOf(AURORA_CSS, `${AURORA_SCOPE} [aria-pressed="true"] > [data-skin~="control"]`).get("background-image"))
                .toBe("var(--aurora-glass-sheen-fill)");
            expect(declarationsOf(AURORA_CSS, `${skin("pill")}[data-skin~="hint"]`).get("background-image")).toBe("none");
            expect(declarationsOf(AURORA_CSS, `${skin("key")}[aria-pressed="true"]`).get("background-image")).toBe("none");
        });

        // It lies on the page under its own scrim, with no board beneath to ghost through, so it needs no dialog glass
        it("should lay the loader's card as card glass, after the dialogs' rule it must beat", () => {
            const loader = `${AURORA_SCOPE} .aurora-loader[data-skin~="card"]`;

            expect(declarationsOf(AURORA_CSS, loader).get("background-color")).toBe("var(--aurora-glass-card-fill)");
            expect(ruleOrder(loader)).toBeGreaterThan(ruleOrder(FLOATING_CARD));
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

    describe("statistics and playback", () => {
        it("should write a section heading in the text colour at 700 and a figure at 700", () => {
            const heading = declarationsOf(AURORA_CSS, skin("stat-heading"));

            expect(heading.get("color")).toBe("var(--color-foreground)");
            expect(heading.get("font-weight")).toBe("700");
            expect(declarationsOf(AURORA_CSS, skin("stat-value")).get("font-weight")).toBe("700");
            // The figures keep the colour the component gives them (primary for wins, win rate and best time)
            expect(declarationsOf(AURORA_CSS, skin("stat-value")).has("color")).toBe(false);
        });

        it("should lay a recent game's row on card glass, rounded 16px", () => {
            const row = declarationsOf(AURORA_CSS, skin("recent-row"));

            expect(row.get("background-color")).toBe("var(--aurora-glass-card-fill)");
            expect(row.get("box-shadow")).toBe("var(--aurora-glass-frame)");
            expect(row.get("border-radius")).toBe("16px");
        });

        it("should lay a given-up game's icon tile in 12% of the error colour under it, after the rules it must beat", () => {
            const tile = declarationsOf(AURORA_CSS, `${skin("icon-tile")}[data-skin~="gave-up"]`);

            expect(tile.get("background-color")).toBe(soft("error", "12%"));
            expect(tile.get("color")).toBe("var(--color-error)");
            expect(ruleOrder(`${skin("icon-tile")}[data-skin~="gave-up"]`)).toBeGreaterThan(ruleOrder(skin("icon-tile")));
        });

        it("should write a game's time in the primary and a given-up game's in the error colour", () => {
            expect(declarationsOf(AURORA_CSS, skin("game-result")).get("color")).toBe("var(--color-primary)");
            expect(declarationsOf(AURORA_CSS, `${skin("game-result")}[data-skin~="gave-up"]`).get("color")).toBe("var(--color-error)");
        });

        it("should lay the progress track in 10% of the text colour, fully round, and fill it from a1 to the primary", () => {
            const track = declarationsOf(AURORA_CSS, skin("progress-track"));
            const fill = declarationsOf(AURORA_CSS, skin("progress-fill"));

            expect(track.get("background-color")).toBe(soft("foreground", "10%"));
            expect(track.get("border-radius")).toBe("9999px");
            expect(fill.get("background-image")).toBe("linear-gradient(90deg, var(--color-aurora-1), var(--color-primary))");
            expect(fill.get("border-radius")).toBe("9999px");
        });

        it("should keep the progress bar's size to the component", () => {
            for (const token of ["progress-track", "progress-fill"]) {
                const sized = ["height", "width", "min-height"].filter(property => declarationsOf(AURORA_CSS, skin(token)).has(property));

                expect(sized).toEqual([]);
            }
        });

        it("should make the play button a primary disc glowing 20px, after the main button it must beat", () => {
            const selector = `${BUTTON}[data-skin~="play"]`;
            const play = declarationsOf(AURORA_CSS, selector);

            expect(play.get("background-color")).toBe("var(--color-primary)");
            expect(play.get("color")).toBe("var(--color-on-primary)");
            expect(play.get("border-radius")).toBe("9999px");
            expect(play.get("box-shadow")).toBe(glow("20px", "50%"));
            expect(ruleOrder(selector)).toBeGreaterThan(ruleOrder(PRIMARY_BUTTON));
        });

        it("should draw the step dots in 12% of the text colour, the ones passed in 40% of the primary and this step's glowing 10px", () => {
            const dot = declarationsOf(AURORA_CSS, skin("step-dot"));
            const past = declarationsOf(AURORA_CSS, `${skin("step-dot")}[data-skin~="step-dot-past"]`);
            const current = declarationsOf(AURORA_CSS, `${skin("step-dot")}[data-skin~="step-dot-current"]`);

            expect(dot.get("background-color")).toBe(soft("foreground", "12%"));
            expect(past.get("background-color")).toBe(soft("primary", "40%"));
            expect(current.get("background-color")).toBe("var(--color-primary)");
            expect(current.get("box-shadow")).toBe("0 0 10px var(--color-primary)");
        });

        it("should leave the dots' 8px and the current dot's 20px width to the component", () => {
            for (const selector of [skin("step-dot"), `${skin("step-dot")}[data-skin~="step-dot-current"]`]) {
                const sized = ["height", "width"].filter(property => declarationsOf(AURORA_CSS, selector).has(property));

                expect(sized).toEqual([]);
            }
        });
    });

    describe("words on the lights", () => {
        // Nothing but the text colour reads 4.5:1 where the lights are brightest (spec ruling 4)
        it("should write the timer's icon and the changelog's note in the text colour", () => {
            expect(declarationsOf(AURORA_CSS, `${AURORA_SCOPE} svg.lucide-timer`).get("color")).toBe("var(--color-foreground)");
            expect(declarationsOf(AURORA_CSS, `${AURORA_SCOPE} [data-skin~="app-note"]`).get("color")).toBe("var(--color-foreground)");
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
            expect(declarationsOf(AURORA_CSS, `${AURORA_SCOPE} [data-skin~="home-subtitle"]`).get("color")).toBe("var(--color-foreground)");
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

    describe("Settings and 外觀", () => {
        const TILE = `${skin("tile")}[aria-pressed]`;
        // A toggle that is on is filled by the markup (bg-primary); a chosen style card stays on the card (bg-card)
        const TOGGLE_ON = `${skin("tile")}[aria-pressed="true"].bg-primary`;
        const CHOSEN_CARD = `${skin("tile")}[aria-pressed="true"].bg-card`;
        const CHECK = skin("check");
        const CHECK_ON = `${TOGGLE_ON} [data-skin~="check"]`;

        it("should set each settings group's heading in the text colour (the group itself is a card)", () => {
            expect(declarationsOf(AURORA_CSS, skin("group-heading")).get("color")).toBe("var(--color-foreground)");
        });

        it("should line option and toggle tiles in 1px of the text colour, rounded 16px, on a 3% wash", () => {
            const tile = declarationsOf(AURORA_CSS, TILE);

            expect(tile.get("box-shadow")).toBe(`inset 0 0 0 1px ${soft("foreground", "12%")}`);
            expect(tile.get("border-radius")).toBe("16px");
            expect(tile.get("background-color")).toBe(soft("foreground", "3%"));
        });

        it("should line a toggle that is on in 50% of the primary on the soft tint", () => {
            const tile = declarationsOf(AURORA_CSS, TOGGLE_ON);

            expect(tile.get("box-shadow")).toBe(`inset 0 0 0 1px ${soft("primary", "50%")}`);
            expect(tile.get("background-color")).toBe(soft("primary", "var(--aurora-tint-soft)"));
        });

        it("should ring a style card that is chosen in 2px of the primary", () => {
            expect(declarationsOf(AURORA_CSS, `${CHOSEN_CARD}.border-primary`).get("box-shadow")).toBe("inset 0 0 0 2px var(--color-primary)");
        });

        it("should draw a toggle's mark as a 34×20 pill track, in 20% of the text colour off and the primary on", () => {
            const track = declarationsOf(AURORA_CSS, `${CHECK}::before`);

            expect(track.get("width")).toBe("34px");
            expect(track.get("height")).toBe("20px");
            expect(track.get("border-radius")).toBe("10px");
            expect(track.get("background-color")).toBe(soft("foreground", "20%"));
            expect(declarationsOf(AURORA_CSS, `${CHECK_ON}::before`).get("background-color")).toBe("var(--color-primary)");
        });

        it("should hide the mark's own ring and check, and draw a 16px sheen knob that slides 14px when on", () => {
            const knob = declarationsOf(AURORA_CSS, `${CHECK}::after`);

            expect(declarationsOf(AURORA_CSS, CHECK).get("background-color")).toBe("transparent");
            expect(declarationsOf(AURORA_CSS, `${CHECK} > svg`).get("visibility")).toBe("hidden");
            expect(knob.get("width")).toBe("16px");
            expect(knob.get("height")).toBe("16px");
            expect(knob.get("border-radius")).toBe("50%");
            expect(knob.get("background-color")).toBe("var(--color-glass-sheen)");
            expect(declarationsOf(AURORA_CSS, `${CHECK_ON}::after`).get("transform")).toBe("translateX(14px)");
        });

        it("should stop the knob's slide under reduced motion", () => {
            expect(reducedMotionDeclarationsOf(AURORA_CSS, `${CHECK}::after`).get("transition")).toBe("none");
        });

        it("should lay segmented controls in 7% of the text colour with a brighter pane for the chosen segment", () => {
            expect(declarationsOf(AURORA_CSS, skin("segmented")).get("background-color")).toBe(soft("foreground", "7%"));
            expect(declarationsOf(AURORA_CSS, skin("segmented-indicator")).get("background-color")).toBe("var(--color-glass-sheen)");
        });

        it("should ring a chosen swatch in the page colour, the primary and a 16px glow", () => {
            expect(declarationsOf(AURORA_CSS, `${skin("swatch")}[aria-pressed="true"]`).get("box-shadow")).toBe(
                `0 0 0 3px var(--color-background), 0 0 0 5px var(--color-primary), ${glow("16px", "60%")}`,
            );
        });
    });

    describe("keys and controls", () => {
        const KEY = skin("key");
        const CONTROL = skin("control");
        const LIT_CONTROL = `${AURORA_SCOPE} [aria-pressed="true"] > [data-skin~="control"]`;

        it("should round a key into a circle of card glass, written at 500", () => {
            const key = declarationsOf(AURORA_CSS, KEY);

            expect(key.get("border-radius")).toBe("50%");
            expect(key.get("background-color")).toBe("var(--aurora-glass-card-fill)");
            expect(key.get("box-shadow")).toBe("var(--aurora-glass-frame)");
            expect(key.get("font-weight")).toBe("500");
        });

        it("should light the key of the same digit, or erase, in the primary with a 22px glow", () => {
            const key = declarationsOf(AURORA_CSS, `${KEY}[aria-pressed="true"]`);

            expect(key.get("background-color")).toBe("var(--color-primary)");
            expect(key.get("color")).toBe("var(--color-on-primary)");
            expect(key.get("box-shadow")).toBe(glow("22px", "60%"));
        });

        it("should fade a used-up key to 35%", () => {
            expect(declarationsOf(AURORA_CSS, `${KEY}:disabled`).get("opacity")).toBe("0.35");
        });

        it("should make a badge a full circle of the primary, written in on-primary, ringed in the page colour", () => {
            const badge = declarationsOf(AURORA_CSS, skin("badge"));

            expect(badge.get("border-radius")).toBe("50%");
            expect(badge.get("background-color")).toBe("var(--color-primary)");
            expect(badge.get("color")).toBe("var(--color-on-primary)");
            expect(badge.get("box-shadow")).toBe("0 0 0 2px var(--color-background)");
        });

        it("should write a control in the text colour on no ground", () => {
            const control = declarationsOf(AURORA_CSS, CONTROL);

            expect(control.get("background-color")).toBe("transparent");
            expect(control.get("box-shadow")).toBe("none");
            expect(control.get("color")).toBe("var(--color-foreground)");
        });

        it("should lay a control that is on as the soft tint of the primary over card glass, written in the primary", () => {
            const control = declarationsOf(AURORA_CSS, LIT_CONTROL);

            expect(control.get("background-color")).toBe(
                "color-mix(in srgb, var(--color-primary) var(--aurora-tint-soft), var(--aurora-glass-card-fill))",
            );
            expect(control.get("box-shadow")).toBe("var(--aurora-glass-frame)");
            expect(control.get("color")).toBe("var(--color-primary)");
        });

        it.each([KEY, CONTROL])("should animate only the transform of a pressed %s", (selector) => {
            expect(declarationsOf(AURORA_CSS, selector).get("transition-property")).toBe("transform");
        });

        it("should leave a key's and a control's press scale to the shared rule, which reduced motion stops", () => {
            for (const selector of [KEY, CONTROL, LIT_CONTROL]) expect(declarationsOf(AURORA_CSS, selector).has("transform")).toBe(false);
            for (const selector of [KEY, CONTROL]) expect(reducedMotionDeclarationsOf(AURORA_CSS, selector).get("transition")).toBe("none");
            expect(reducedMotionDeclarationsOf(AURORA_CSS, `${AURORA_SCOPE} [data-press-motion][data-pressed]`).get("transform")).toBe("none");
        });
    });

    describe("the board", () => {
        const BOARD = skin("board");
        const cell = (variant: string): string => `${BOARD} [data-variant="${variant}"]`;
        const groundOf = (variant: string): string => declarationsOf(AURORA_CSS, cell(variant)).get("--aurora-cell-ground") ?? "";
        const CELL_GLASS = "var(--aurora-glass-cell-fill)";
        const over = (token: string, amount: string, base: string): string => `color-mix(in srgb, var(--color-${token}) ${amount}, ${base})`;
        const SELECTION_GLOW = `0 0 10px ${soft("primary", "35%")}`;
        const ERROR_STRIPES = `repeating-linear-gradient(45deg, ${soft("error", "var(--aurora-error-stripe)")} 0 2px, transparent 2px 6px)`;

        it("should lay no ground or shadow under the board and its grid, and clear the grid's frame and lines", () => {
            const board = declarationsOf(AURORA_CSS, BOARD);
            const grid = declarationsOf(AURORA_CSS, skin("board-grid"));

            expect(board.get("background-color")).toBe("transparent");
            expect(board.get("box-shadow")).toBe("none");
            expect(grid.get("background-color")).toBe("transparent");
            expect(grid.get("box-shadow")).toBe("none");
            expect(grid.get("border-color")).toBe("transparent");
            expect(grid.get("--board-line")).toBe("transparent");
            expect(grid.get("--board-box-line")).toBe("transparent");
        });

        it("should make the cell's glass a tint of the glass colour at the cell's density under the cell's sheen", () => {
            expect(auroraProperty(AURORA_SCOPE, "--aurora-glass-cell-fill")).toBe(
                `color-mix(in srgb, var(--color-glass-sheen) var(--aurora-sheen-cell), ${soft("glass", "var(--aurora-glass-cell)")})`,
            );
        });

        it("should paint each cell its own ground inside its padding box, rounded 5px, so the lines become gaps", () => {
            const cells = declarationsOf(AURORA_CSS, `${BOARD} [data-variant]`);

            expect(cells.get("background-clip")).toBe("padding-box");
            expect(cells.get("background-color")).toBe("var(--aurora-cell-ground)");
            expect(cells.get("border-radius")).toBe("5px");
            expect(cells.get("box-shadow")).toBe("none");
        });

        it.each([
            ["top-left", "border-top-left-radius"],
            ["top-right", "border-top-right-radius"],
            ["bottom-left", "border-bottom-left-radius"],
            ["bottom-right", "border-bottom-right-radius"],
        ])("should round a box's %s corner 14px and that corner alone", (corner, property) => {
            const declarations = declarationsOf(AURORA_CSS, `${BOARD} [data-box-corner="${corner}"]`);

            expect([...declarations]).toEqual([[property, "14px"]]);
        });

        it("should lay plain cells and clues on the cell's glass, and peers and a step's scope under the peer sheen", () => {
            expect(groundOf("default")).toBe(CELL_GLASS);
            expect(groundOf("clue")).toBe(CELL_GLASS);
            expect(groundOf("peer")).toBe(over("glass-sheen", "var(--aurora-sheen-peer)", CELL_GLASS));
            expect(groundOf("scope")).toBe(over("glass-sheen", "var(--aurora-sheen-peer)", CELL_GLASS));
        });

        it("should tint the same digit and a step's pattern with the primary, written in it", () => {
            expect(groundOf("same-digit")).toBe(over("primary", "var(--aurora-tint-same)", CELL_GLASS));
            expect(groundOf("pattern")).toBe(over("primary", "var(--aurora-tint-same)", CELL_GLASS));
            expect(declarationsOf(AURORA_CSS, `${cell("same-digit")}[data-value-kind] > div`).get("color")).toBe("var(--color-primary)");
            expect(declarationsOf(AURORA_CSS, `${cell("pattern")}[data-value-kind] > div`).get("color")).toBe("var(--color-primary)");
        });

        it("should write clues in the text colour at 500 and the player's digits in the primary at 600", () => {
            const given = declarationsOf(AURORA_CSS, `${BOARD} [data-value-kind="given"] > div`);
            const entered = declarationsOf(AURORA_CSS, `${BOARD} [data-value-kind="entered"] > div`);

            expect(given.get("color")).toBe("var(--color-foreground)");
            expect(given.get("font-weight")).toBe("500");
            expect(entered.get("color")).toBe("var(--color-primary)");
            expect(entered.get("font-weight")).toBe("600");
        });

        it("should lay every digit above the glows, the selected and answer cells (ruling 4)", () => {
            const digits = declarationsOf(AURORA_CSS, `${BOARD} [data-variant] > div`);

            expect(digits.get("position")).toBe("relative");
            expect(digits.get("z-index")).toBe("2");
        });

        it("should light the selected cell with the solid primary, a 40% ring and a 10px glow, written in on-primary", () => {
            const selected = declarationsOf(AURORA_CSS, cell("selected"));

            expect(groundOf("selected")).toBe("var(--color-primary)");
            expect(selected.get("z-index")).toBe("1");
            expect(selected.has("box-shadow")).toBe(false);
            expect(declarationsOf(AURORA_CSS, `${cell("selected")}::after`).get("box-shadow")).toBe(
                `0 0 0 2px ${soft("primary", "40%")}, ${SELECTION_GLOW}`,
            );
            expect(selected.has("background-image")).toBe(false);
            expect(declarationsOf(AURORA_CSS, cell("same-digit")).has("background-image")).toBe(false);
            expect(declarationsOf(AURORA_CSS, `${cell("selected")}[data-value-kind] > div`).get("color")).toBe("var(--color-on-primary)");
        });

        it("should write the selected cell's notes in on-primary and its highlighted note as an on-primary disc", () => {
            const highlighted = declarationsOf(AURORA_CSS, `${cell("selected")} [data-note-highlight]`);

            expect(declarationsOf(AURORA_CSS, `${cell("selected")} .font-note.text-note`).get("color")).toBe("var(--color-on-primary)");
            expect(highlighted.get("background-color")).toBe("var(--color-on-primary)");
            expect(highlighted.get("color")).toBe("var(--color-primary)");
        });

        it.each(["error", "wrong"])("should wash an %s cell in the error colour and hatch it, written in it", (variant) => {
            expect(groundOf(variant)).toBe(over("error", "var(--aurora-error-wash)", CELL_GLASS));
            expect(declarationsOf(AURORA_CSS, cell(variant)).get("background-image")).toBe(ERROR_STRIPES);
            expect(declarationsOf(AURORA_CSS, `${cell(variant)}[data-value-kind="entered"] > div`).get("color")).toBe("var(--color-error)");
        });

        it("should lay the error rules after the selected, same-digit and peer cells'", () => {
            const errors = ruleOrder(`${cell("error")}, ${cell("wrong")}`);

            expect(errors).toBeGreaterThan(ruleOrder(cell("selected")));
            expect(errors).toBeGreaterThan(ruleOrder(`${cell("same-digit")}, ${cell("pattern")}`));
            expect(errors).toBeGreaterThan(ruleOrder(`${cell("peer")}, ${cell("scope")}`));
        });

        it("should keep the hatching when pressed, under the press wash", () => {
            expect(declarationsOf(AURORA_CSS, `${cell("error")}[data-pressed]`).get("background-image")).toBe(
                `linear-gradient(var(--press-overlay), var(--press-overlay)), ${ERROR_STRIPES}`,
            );
        });

        it("should mark a selected error by a ring of the solid primary alone, keeping its hatching (ruling 2)", () => {
            const selectedError = declarationsOf(AURORA_CSS, `${cell("error")}[data-selected]`);

            expect(selectedError.get("z-index")).toBe("1");
            expect(selectedError.has("box-shadow")).toBe(false);
            expect(declarationsOf(AURORA_CSS, `${cell("error")}[data-selected]::after`).get("box-shadow")).toBe("0 0 0 2px var(--color-primary)");
            expect(selectedError.has("background-image")).toBe(false);
            expect(selectedError.has("--aurora-cell-ground")).toBe(false);
        });

        it("should draw the selection's ring on the cell's ::after over its glass alone, so it hugs all four sides", () => {
            const rings = [`${cell("selected")}::after`, `${cell("error")}[data-selected]::after`];

            for (const ring of rings) {
                const declarations = declarationsOf(AURORA_CSS, ring);
                expect(declarations.get("content"), ring).toBe('""');
                expect(declarations.get("position"), ring).toBe("absolute");
                expect(declarations.get("inset"), ring).toBe("0");
                expect(declarations.get("border-radius"), ring).toBe("inherit");
                expect(declarations.get("pointer-events"), ring).toBe("none");
            }
        });

        it("should line a step's wrong cell with 2px of the error colour inside it", () => {
            expect(declarationsOf(AURORA_CSS, cell("wrong")).get("box-shadow")).toBe("inset 0 0 0 2px var(--color-error)");
        });

        it("should mark a step's answer cell, on every board, by the soft tint, a 2px inner line and the selection's glow", () => {
            const answer = declarationsOf(AURORA_CSS, cell("answer"));

            expect(groundOf("answer")).toBe(over("primary", "var(--aurora-tint-soft)", CELL_GLASS));
            expect(answer.get("box-shadow")).toBe(`inset 0 0 0 2px var(--color-primary), ${SELECTION_GLOW}`);
            expect(answer.get("z-index")).toBe("1");
        });

        it("should write notes at 500 in the note colour and the selected digit's in the primary at 700", () => {
            const notes = declarationsOf(AURORA_CSS, `${BOARD} .font-note.text-note`);
            const highlighted = declarationsOf(AURORA_CSS, `${BOARD} [data-note-highlight]`);

            expect(notes.get("color")).toBe("var(--color-note)");
            expect(notes.get("font-weight")).toBe("500");
            expect(highlighted.get("background-color")).toBe("transparent");
            expect(highlighted.get("color")).toBe("var(--color-primary)");
            expect(highlighted.get("font-weight")).toBe("700");
        });

        it("should write a step's candidates in the primary at 700, its emphasised one a primary disc, on every board", () => {
            const candidates = declarationsOf(AURORA_CSS, `${BOARD} .font-note.text-primary`);
            const emphasised = declarationsOf(AURORA_CSS, `${BOARD} :is([data-variant="answer"], [data-variant="pattern"]) [data-note-highlight]`);

            expect(candidates.get("color")).toBe("var(--color-primary)");
            expect(candidates.get("font-weight")).toBe("700");
            expect(emphasised.get("background-color")).toBe("var(--color-primary)");
            expect(emphasised.get("color")).toBe("var(--color-on-primary)");
        });

        // Level through the middle, not the canvas's diagonal, which runs along a 1's own stroke, and a little past the
        // glyph on both sides, as a 1 is hardly wider than its stem
        it("should strike a step's eliminated candidates in the error colour with a level 1.5px line, on every board", () => {
            const strike = declarationsOf(AURORA_CSS, `${BOARD} .font-note.strike-diagonal::after`);

            expect(declarationsOf(AURORA_CSS, `${BOARD} .font-note.strike-diagonal`).get("color")).toBe("var(--color-error)");
            expect(strike.get("inset")).toBe("0 -0.15em");
            expect(strike.get("background-image")).toBe(
                "linear-gradient(to bottom, transparent calc(50% - 0.75px), currentColor calc(50% - 0.75px), "
                + "currentColor calc(50% + 0.75px), transparent calc(50% + 0.75px))",
            );
        });

        it("should leave every board rule free of hint mode, so Game Review and the Walkthrough match", () => {
            const hintModeRules: string[] = [];
            postcss.parse(AURORA_CSS).walkRules((rule: Rule) => {
                if (rule.selector.includes("data-hint-mode")) hintModeRules.push(rule.selector);
            });

            expect(hintModeRules).toEqual([]);
        });

        // The selected cell's ring lies on the ::after, so a pulse or an erased digit never takes it away
        it("should leave the cells' ::before to the arrival's pulse and the erased digit alone", () => {
            const cellBefores = new Set<string>();
            postcss.parse(AURORA_CSS).walkRules((rule: Rule) => {
                for (const selector of rule.selectors.map(item => item.replace(/\s+/g, " ").trim())) {
                    if (/\[data-variant[^\]]*\][^ ]*::before/.test(selector)) cellBefores.add(selector);
                }
            });

            expect([...cellBefores]).toEqual([
                `${BOARD} [data-variant][data-arriving]::before`,
                `${BOARD} [data-variant="selected"][data-arriving]::before`,
                `${BOARD} [data-variant].value-leave::before`,
                `${BOARD} [data-variant="selected"].value-leave::before`,
            ]);
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

            expect(ribbon.get("--aurora-ribbon-first-light")).toBe("color-mix(in srgb, var(--color-aurora-1) var(--aurora-ribbon-first), transparent)");
            expect(ribbon.get("--aurora-ribbon-second-light")).toBe("color-mix(in srgb, var(--color-aurora-2) var(--aurora-ribbon-second), transparent)");
            expect(image).toBe(`${ribbonLight("33% 50%", "var(--aurora-ribbon-first-light)")}, ${ribbonLight("64% 50%", "var(--aurora-ribbon-second-light)")}`);
            expect(ribbon.get("transform")).toBe("rotate(-12deg)");
        });

        // auroraGround takes a light's core at its full colour: the falloff starts there and only ever fades
        it("should ease every light out from its full colour at the core, never brighter further out", () => {
            const shares = [100, ...FALLOFF.map(([share]) => share), 0];
            const points = [0, ...FALLOFF.map(([, at]) => at), FADE_END];

            expect(shares.every((share, index) => index === 0 || share < shares[index - 1])).toBe(true);
            expect(points.every((point, index) => index === 0 || point > points[index - 1])).toBe(true);
        });

        // The contrast model takes the brightest point as one light's core: no two cores ever meet
        it.each(VIEWPORTS)("should keep every two lights' cores a fade radius apart in a %ix%i window", (width, height) => {
            const fadeRadius = FADE_END / 100 * geometry("--aurora-blob-size") * Math.SQRT2 / 2;
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
