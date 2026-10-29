import { readFileSync } from "fs";
import postcss, { type AtRule } from "postcss";
import { declarationsOf } from "../../styleSheetRules";

const BLUEPRINT_CSS = readFileSync("src/style/styles/blueprint/skin.css", "utf8");

const SCOPE = '[data-style="blueprint"]';
const FONTS_READY = `${SCOPE}[data-blueprint-fonts="ready"]`;
// The graph paper lies on the body, so it spans the whole window, not just the app's column
const SHEET = `${SCOPE} body`;
const skin = (tokens: string): string => `${SCOPE} [data-skin~="${tokens.split(" ").join('"][data-skin~="')}"]`;
const RAW_COLOUR = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|\bwhite\b|\bblack\b/;
const SCRIM = "color-mix(in srgb, var(--color-background) 72%, transparent)";

const collapse = (text: string): string => text.replace(/\s+/g, " ").trim();

// Every rule outside @keyframes, with its collapsed selectors and declarations
const allRules = (): { selectors: string[]; declarations: Map<string, string> }[] => {
    const rules: { selectors: string[]; declarations: Map<string, string> }[] = [];
    postcss.parse(BLUEPRINT_CSS).walkRules((rule) => {
        if (rule.parent?.type === "atrule" && (rule.parent as AtRule).name.endsWith("keyframes")) return;
        const declarations = new Map<string, string>();
        rule.walkDecls((declaration) => {
            declarations.set(declaration.prop, collapse(declaration.value));
        });
        rules.push({ selectors: rule.selectors.map(collapse), declarations });
    });
    return rules;
};

const isPseudoElement = (selector: string): boolean => /::(?:before|after)$/.test(selector);

describe("blueprint skin", () => {
    describe("frames", () => {
        it("should name the single, strong and double frames as inset lines in the ink, the double one round a strip of paper", () => {
            const scope = declarationsOf(BLUEPRINT_CSS, SCOPE);

            expect(scope.get("--blueprint-frame")).toBe("inset 0 0 0 1px var(--color-foreground)");
            expect(scope.get("--blueprint-frame-strong")).toBe("inset 0 0 0 1.5px var(--color-foreground)");
            // The canvas's 1.5px frame, 5px of paper and a 0.75px line, drawn inward so no scroller clips it
            expect(scope.get("--blueprint-double-frame")).toBe(
                "inset 0 0 0 0.75px var(--color-border), inset 0 0 0 4.25px var(--color-background), inset 0 0 0 5.75px var(--color-foreground)",
            );
        });
    });

    describe("graph paper", () => {
        it("should rule the whole window as graph paper, 40px major and 8px minor squares, fixed to the window", () => {
            const sheet = declarationsOf(BLUEPRINT_CSS, SHEET);
            const image = sheet.get("background-image") ?? "";

            expect(sheet.get("background-color")).toBe("var(--color-background)");
            expect(image.match(/linear-gradient\(/g)).toHaveLength(4);
            expect(image.match(/var\(--color-grid-major\) 1px/g)).toHaveLength(2);
            expect(image.match(/var\(--color-grid-minor\) 1px/g)).toHaveLength(2);
            expect(sheet.get("background-size")).toBe("40px 40px, 40px 40px, 8px 8px, 8px 8px");
            expect(sheet.get("background-attachment")).toBe("fixed");
        });

        it("should frame the window 10px in with a 1.5px line, fixed below every content layer, never taking taps", () => {
            const frame = declarationsOf(BLUEPRINT_CSS, `${SHEET}::before`);

            expect(frame.get("content")).toBe('""');
            expect(frame.get("position")).toBe("fixed");
            expect(frame.get("inset")).toBe("10px");
            expect(frame.get("box-shadow")).toBe("inset 0 0 0 1.5px var(--color-border)");
            expect(frame.get("z-index")).toBe("-1");
            expect(frame.get("pointer-events")).toBe("none");
        });

        it("should draw a 0.75px line 4px inside the frame, with ticks along its top every quarter, as the canvas's .sheet", () => {
            const inner = declarationsOf(BLUEPRINT_CSS, `${SHEET}::after`);

            expect(inner.get("position")).toBe("fixed");
            expect(inner.get("inset")).toBe("10px");
            expect(inner.get("z-index")).toBe("-1");
            expect(inner.get("pointer-events")).toBe("none");
            expect(inner.get("background-image")).toContain("linear-gradient(90deg, var(--color-border) 1px, transparent 1px)");
            expect(inner.get("background-size")).toContain("25% 6px");
            // Four sides of the fine line, 1.5px of frame and 4px of paper in
            expect(inner.get("background-size")?.match(/0\.75px/g)).toHaveLength(4);
            expect(inner.get("background-position")).toContain("5.5px 5.5px");
        });

        it("should leave the page scroller, every page and a sticky header at rest clear, so the paper shows without a strip at the column", () => {
            expect(declarationsOf(BLUEPRINT_CSS, skin("page-ruled")).get("background")).toBe("transparent");
            expect(declarationsOf(BLUEPRINT_CSS, skin("page")).get("background-color")).toBe("transparent");
            expect(declarationsOf(BLUEPRINT_CSS, skin("page-header")).get("background-color")).toBe("transparent");
        });
    });

    describe("type", () => {
        it("should set the interface in Sans TC, digits in Mono and the player's digits in Hand, once the faces have loaded", () => {
            const ready = declarationsOf(BLUEPRINT_CSS, FONTS_READY);

            expect(ready.get("--font-sans")).toBe("var(--font-blueprint-sans)");
            for (const token of ["--font-clue", "--font-key", "--font-timer", "--font-note", "--font-mono"]) {
                expect(ready.get(token), token).toBe("var(--font-blueprint-mono)");
            }
            expect(ready.get("--font-entry")).toBe("var(--font-blueprint-hand)");
            expect(declarationsOf(BLUEPRINT_CSS, SCOPE).get("--font-sans")).toBeUndefined();
        });

        it("should set titles light and dialog titles medium", () => {
            expect(declarationsOf(BLUEPRINT_CSS, `${FONTS_READY} [data-skin~="title"]`).get("font-weight")).toBe("300");
            expect(declarationsOf(BLUEPRINT_CSS, `${FONTS_READY} [data-skin~="dialog-title"]`).get("font-weight")).toBe("500");
        });

        it("should draw lucide icons in a drafting pen: 1.5 strokes with square ends and mitred corners", () => {
            const icon = declarationsOf(BLUEPRINT_CSS, `${SCOPE} svg.lucide`);

            expect(icon.get("stroke-width")).toBe("1.5");
            expect(icon.get("stroke-linecap")).toBe("square");
            expect(icon.get("stroke-linejoin")).toBe("miter");
        });

        it("should set no letter-spacing, font-size or border on any element (only placed decorations size themselves)", () => {
            const offending = allRules().flatMap(rule => rule.selectors
                .filter(selector => !isPseudoElement(selector))
                .flatMap(selector => ["letter-spacing", "font-size", "border"]
                    .filter(property => rule.declarations.has(property))
                    .map(property => `${selector} → ${property}`)));

            expect(offending).toEqual([]);
        });

        it("should name every colour by a token, in both modes", () => {
            const raw = allRules().flatMap(rule => Array.from(rule.declarations.entries())
                .filter(([, value]) => RAW_COLOUR.test(value))
                .map(([property]) => `${rule.selectors.join(", ")} → ${property}`));

            expect(raw).toEqual([]);
        });
    });

    describe("shared pieces", () => {
        it.each(["card", "button", "text-button", "pill", "tag", "icon-tile", "toast", "menu-option"])("should square the corners of a %s", (token) => {
            expect(declarationsOf(BLUEPRINT_CSS, skin(token)).get("border-radius")).toBe("0");
        });

        it("should keep the trophy round", () => {
            expect(declarationsOf(BLUEPRINT_CSS, skin("trophy")).get("border-radius")).toBe("50%");
        });

        // paletteContrast.test.ts lets 藍曬圖's danger and error miss 4.5:1 on the card token only because no
        // card is drawn in it: cards are the page's own paper
        it("should lay a card in the page's paper inside the double frame", () => {
            const card = declarationsOf(BLUEPRINT_CSS, skin("card"));

            expect(card.get("background-color")).toBe("var(--color-background)");
            expect(card.get("box-shadow")).toBe("var(--blueprint-double-frame)");
            expect(card.get("border-color")).toBe("transparent");
        });

        it("should keep the double frame and the paper on dialogs and floating panels, with a soft shadow below", () => {
            const floating = declarationsOf(BLUEPRINT_CSS, `${skin("card")}:is(.shadow-modal, .shadow-popup, .shadow-card-lg)`);

            expect(floating.get("background-color")).toBe("var(--color-background)");
            expect(floating.get("box-shadow")).toMatch(/^var\(--blueprint-double-frame\), 0 24px 40px -18px color-mix\(in srgb, var\(--color-shadow\) [\d.]+%, transparent\)$/);
        });

        it.each(["loader-scrim", "dialog-scrim"])("should veil the screen under a %s in 72%% of the paper", (token) => {
            expect(declarationsOf(BLUEPRINT_CSS, skin(token)).get("background-color")).toBe(SCRIM);
        });

        it("should fill main buttons with the primary", () => {
            const main = declarationsOf(BLUEPRINT_CSS, `${skin("button")}:is(.bg-primary, .hint-primary)`);

            expect(main.get("background-color")).toBe("var(--color-primary)");
            expect(main.get("color")).toBe("var(--color-on-primary)");
            expect(main.get("box-shadow")).toBe("none");
        });

        it("should draw secondary and outlined buttons clear inside a 1px line of ink", () => {
            const secondary = declarationsOf(BLUEPRINT_CSS, `${skin("button")}:is(.bg-card, .bg-primary-light, .hint-secondary)`);

            expect(secondary.get("background-color")).toBe("transparent");
            expect(secondary.get("box-shadow")).toBe("var(--blueprint-frame)");
            expect(secondary.get("border-color")).toBe("transparent");
            expect(secondary.get("color")).toBe("var(--color-foreground)");
        });

        it("should fill the danger button with the error colour, written in the paper", () => {
            const danger = declarationsOf(BLUEPRINT_CSS, `${skin("button")}.bg-danger`);

            expect(danger.get("background-color")).toBe("var(--color-danger)");
            expect(danger.get("color")).toBe("var(--color-on-danger)");
            expect(danger.get("box-shadow")).toBe("none");
        });

        it("should draw icon tiles clear inside a 1px line of ink, a danger or given-up one in the error colour", () => {
            const tile = declarationsOf(BLUEPRINT_CSS, skin("icon-tile"));

            expect(tile.get("background-color")).toBe("transparent");
            expect(tile.get("box-shadow")).toBe("var(--blueprint-frame)");
            for (const tokens of ["icon-tile danger", "icon-tile gave-up"]) {
                expect(declarationsOf(BLUEPRINT_CSS, skin(tokens)).get("box-shadow"), tokens).toBe("inset 0 0 0 1px var(--color-danger)");
            }
        });

        it("should outline the header's pills in a 1px line of ink and fill the hint-mode pill with the primary", () => {
            const pill = declarationsOf(BLUEPRINT_CSS, skin("pill"));
            const hint = declarationsOf(BLUEPRINT_CSS, skin("pill hint"));

            expect(pill.get("background-color")).toBe("transparent");
            expect(pill.get("box-shadow")).toBe("var(--blueprint-frame)");
            expect(pill.get("color")).toBe("var(--color-foreground)");
            expect(hint.get("background-color")).toBe("var(--color-primary)");
            expect(hint.get("box-shadow")).toBe("inset 0 0 0 1px var(--color-primary)");
            expect(hint.get("color")).toBe("var(--color-on-primary)");
        });

        it("should stamp a new record in a 2px line of the primary, turned −6°, in Mono", () => {
            const record = declarationsOf(BLUEPRINT_CSS, skin("tag new-record"));

            expect(record.get("background-color")).toBe("transparent");
            expect(record.get("box-shadow")).toBe("inset 0 0 0 2px var(--color-primary)");
            expect(record.get("color")).toBe("var(--color-primary)");
            expect(record.get("transform")).toBe("rotate(-6deg)");
            expect(declarationsOf(BLUEPRINT_CSS, `${FONTS_READY} [data-skin~="tag"][data-skin~="new-record"]`).get("font-family")).toBe("var(--font-blueprint-mono)");
        });

        it("should outline a step's tag in a 1px line of ink and fill a final step's with the primary", () => {
            const step = declarationsOf(BLUEPRINT_CSS, skin("tag step"));
            const strong = declarationsOf(BLUEPRINT_CSS, skin("tag step strong"));

            expect(step.get("background-color")).toBe("transparent");
            expect(step.get("box-shadow")).toBe("var(--blueprint-frame)");
            expect(step.get("color")).toBe("var(--color-foreground)");
            expect(strong.get("background-color")).toBe("var(--color-primary)");
            expect(strong.get("box-shadow")).toBe("none");
            expect(strong.get("color")).toBe("var(--color-on-primary)");
        });

        it("should outline the changelog's App tag in a 1px line of the primary", () => {
            const tag = declarationsOf(BLUEPRINT_CSS, skin("app-tag"));

            expect(tag.get("background-color")).toBe("transparent");
            expect(tag.get("box-shadow")).toBe("inset 0 0 0 1px var(--color-primary)");
            expect(tag.get("color")).toBe("var(--color-primary)");
        });

        it("should write the toast in the paper on the ink, in Mono", () => {
            const toast = declarationsOf(BLUEPRINT_CSS, skin("toast"));

            expect(toast.get("background-color")).toBe("var(--color-foreground)");
            expect(toast.get("color")).toBe("var(--color-background)");
            expect(declarationsOf(BLUEPRINT_CSS, `${FONTS_READY} [data-skin~="toast"]`).get("font-family")).toBe("var(--font-blueprint-mono)");
        });

        it("should colour the continue card's play mark in the primary", () => {
            expect(declarationsOf(BLUEPRINT_CSS, skin("caret")).get("color")).toBe("var(--color-primary)");
        });
    });

    describe("Home", () => {
        const LOGO_SVG = readFileSync("src/style/styles/blueprint/blueprint-logo.svg", "utf8");
        const LOGO_URL = 'url("@/style/styles/blueprint/blueprint-logo.svg")';

        it("should draw the logo as a small drawing, its mask painted in the ink", () => {
            const logo = declarationsOf(BLUEPRINT_CSS, skin("logo"));

            expect(logo.get("-webkit-mask-image")).toBe(LOGO_URL);
            expect(logo.get("mask-image")).toBe(LOGO_URL);
            expect(logo.get("background-color")).toBe("var(--color-foreground)");
            expect(logo.get("box-shadow")).toBe("none");
            // The stacked logo's squares would show through the mask
            expect(declarationsOf(BLUEPRINT_CSS, `${skin("logo")} > *`).get("visibility")).toBe("hidden");
        });

        it("should draw the logo with no words and no filters: a 3×3 grid, two dimension lines, a leader and a cross", () => {
            expect(LOGO_SVG).not.toMatch(/<text\b/);
            expect(LOGO_SVG).not.toMatch(/<filter\b/);
            expect(LOGO_SVG).toMatch(/<rect\b/);
            expect(LOGO_SVG).toMatch(/<circle\b/);
            // Two pairs of arrowheads, filled
            expect(LOGO_SVG.match(/data-part="arrowheads"/g)).toHaveLength(2);
            expect(LOGO_SVG).toMatch(/data-part="cross"/);
        });

        it("should frame the continue card in 1.5px of ink and caption each column in the pale ink", () => {
            const caption = declarationsOf(BLUEPRINT_CSS, `${skin("chip")}::before`);

            expect(declarationsOf(BLUEPRINT_CSS, skin("continue")).get("box-shadow")).toBe("var(--blueprint-frame-strong)");
            expect(declarationsOf(BLUEPRINT_CSS, skin("chip")).get("background-color")).toBe("transparent");
            expect(caption.get("content")).toBe('attr(data-caption) / ""');
            expect(caption.get("color")).toBe("var(--color-foreground-secondary)");
        });

        it("should frame the new game card in 1.5px of ink", () => {
            expect(declarationsOf(BLUEPRINT_CSS, skin("new-game-card")).get("box-shadow")).toBe("var(--blueprint-frame-strong)");
        });

        it("should rule a segmented control into square cells, the chosen one written in the paper on the ink", () => {
            const segmented = declarationsOf(BLUEPRINT_CSS, skin("segmented"));
            const indicator = declarationsOf(BLUEPRINT_CSS, skin("segmented-indicator"));

            expect(segmented.get("--segmented-gap")).toBe("0px");
            expect(segmented.get("--segmented-padding")).toBe("0px");
            expect(segmented.get("background-color")).toBe("transparent");
            expect(segmented.get("box-shadow")).toBe("inset 0 0 0 1px var(--color-border)");
            expect(segmented.get("border-radius")).toBe("0");
            expect(indicator.get("background-color")).toBe("var(--color-foreground)");
            expect(indicator.get("box-shadow")).toBe("none");
            expect(indicator.get("border-radius")).toBe("0");
            expect(declarationsOf(BLUEPRINT_CSS, skin("segment")).get("border-radius")).toBe("0");
            expect(declarationsOf(BLUEPRINT_CSS, `${skin("segment")}:not(:last-child)`).get("box-shadow")).toBe("inset -1px 0 0 var(--color-border)");
            expect(declarationsOf(BLUEPRINT_CSS, `${skin("segment")}[aria-pressed="true"]`).get("color")).toBe("var(--color-background)");
        });

        it("should frame Home's tiles in 1px of ink, numbered A1–A3 in the pale Mono, their icons in the ink", () => {
            const tile = declarationsOf(BLUEPRINT_CSS, skin("home-tile"));
            const number = declarationsOf(BLUEPRINT_CSS, `${skin("home-tile")}::before`);

            expect(tile.get("box-shadow")).toBe("var(--blueprint-frame)");
            expect(tile.get("border-radius")).toBe("0");
            expect(tile.get("position")).toBe("relative");
            expect(tile.get("counter-increment")).toBe("blueprint-tile");
            expect(number.get("content")).toBe('"A" counter(blueprint-tile) / ""');
            expect(number.get("font-family")).toBe("var(--font-mono)");
            expect(number.get("color")).toBe("var(--color-foreground-secondary)");
            expect(number.get("pointer-events")).toBe("none");
            expect(declarationsOf(BLUEPRINT_CSS, `${skin("home-tile")} > svg`).get("color")).toBe("var(--color-foreground)");
        });
    });

    describe("Settings and 外觀", () => {
        const CHOICE = `${skin("tile")}[aria-pressed]`;
        const CHOSEN = `${skin("tile")}[aria-pressed="true"]`;
        const CROSS_STROKE = (angle: string): string =>
            `linear-gradient(${angle}, transparent calc(50% - 1px), var(--color-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px))`;

        it("should frame each settings card in 1.5px of ink", () => {
            expect(declarationsOf(BLUEPRINT_CSS, skin("settings-card")).get("box-shadow")).toBe("var(--blueprint-frame-strong)");
        });

        it("should number each group's heading B-01, B-02… on its right in the pale Mono, counted from the page", () => {
            const heading = declarationsOf(BLUEPRINT_CSS, skin("group-heading"));
            const number = declarationsOf(BLUEPRINT_CSS, `${skin("group-heading")}::after`);

            expect(declarationsOf(BLUEPRINT_CSS, skin("page")).get("counter-reset")).toBe("blueprint-group");
            expect(heading.get("color")).toBe("var(--color-foreground)");
            expect(heading.get("font-weight")).toBe("500");
            expect(declarationsOf(BLUEPRINT_CSS, `${skin("group-heading")} > svg`).get("color")).toBe("var(--color-foreground)");
            expect(number.get("counter-increment")).toBe("blueprint-group");
            expect(number.get("content")).toBe('"B-" counter(blueprint-group, decimal-leading-zero) / ""');
            expect(number.get("margin-left")).toBe("auto");
            expect(number.get("font-family")).toBe("var(--font-mono)");
            expect(number.get("font-size")).toBe("11px");
            expect(number.get("font-weight")).toBe("400");
            expect(number.get("color")).toBe("var(--color-foreground-secondary)");
        });

        it("should draw option and toggle tiles clear and square in a 1px line, a chosen one in the primary with a line inside it", () => {
            const choice = declarationsOf(BLUEPRINT_CSS, CHOICE);
            const chosen = declarationsOf(BLUEPRINT_CSS, CHOSEN);

            expect(choice.get("border-color")).toBe("transparent");
            expect(choice.get("background-color")).toBe("transparent");
            expect(choice.get("box-shadow")).toBe("inset 0 0 0 1px var(--color-border)");
            expect(choice.get("border-radius")).toBe("0");
            expect(choice.get("color")).toBe("var(--color-foreground)");
            expect(chosen.get("background-color")).toBe("transparent");
            expect(chosen.get("box-shadow")).toBe("inset 0 0 0 1px var(--color-primary), inset 0 0 0 2px var(--color-primary)");
            expect(chosen.get("color")).toBe("var(--color-foreground)");
            // The markup inks a chosen tile's icon and words for a filled tile
            expect(declarationsOf(BLUEPRINT_CSS, `${CHOSEN} > .text-on-primary`).get("color")).toBe("var(--color-primary)");
            expect(declarationsOf(BLUEPRINT_CSS, `${CHOSEN} span .text-on-primary`).get("color")).toBe("var(--color-foreground-secondary)");
        });

        it("should draw a toggle's mark as a 16px square of ink in its middle, crossed in the primary when on", () => {
            const mark = declarationsOf(BLUEPRINT_CSS, skin("check"));
            const on = declarationsOf(BLUEPRINT_CSS, `${CHOSEN} [data-skin~="check"]`);
            const SIDES = "linear-gradient(var(--blueprint-check-ink), var(--blueprint-check-ink))";

            expect(mark.get("--blueprint-check-ink")).toBe("var(--color-foreground)");
            expect(mark.get("border-color")).toBe("transparent");
            expect(mark.get("background-color")).toBe("transparent");
            expect(mark.get("border-radius")).toBe("0");
            expect(declarationsOf(BLUEPRINT_CSS, `${skin("check")} > svg`).get("visibility")).toBe("hidden");
            // Four 1px sides of a 16px square, 2px in from the mark's 20px border box whether or not it has its border
            expect(mark.get("background-image")).toBe(Array<string>(4).fill(SIDES).join(", "));
            expect(mark.get("background-size")).toBe("16px 1px, 16px 1px, 1px 16px, 1px 16px");
            expect(mark.get("background-position")).toBe("2px 2px, 2px 17px, 2px 2px, 17px 2px");
            expect(mark.get("background-origin")).toBe("border-box");
            expect(on.get("--blueprint-check-ink")).toBe("var(--color-primary)");
            expect(on.get("background-image")).toBe([...Array<string>(4).fill(SIDES), CROSS_STROKE("45deg"), CROSS_STROKE("-45deg")].join(", "));
            expect(on.get("background-size")).toBe("16px 1px, 16px 1px, 1px 16px, 1px 16px, 16px 16px, 16px 16px");
        });

        it("should square the swatches in a 1px line of ink, so 藍曬圖's paper swatch shows, and ring a chosen one twice in the primary", () => {
            const swatch = declarationsOf(BLUEPRINT_CSS, skin("swatch"));
            const chosen = declarationsOf(BLUEPRINT_CSS, `${skin("swatch")}[aria-pressed="true"]`);

            expect(swatch.get("border-radius")).toBe("0");
            expect(swatch.get("box-shadow")).toBe("inset 0 0 0 1px var(--color-foreground)");
            expect(chosen.get("box-shadow")).toBe(
                "inset 0 0 0 1px var(--color-foreground), 0 0 0 3px var(--color-background), 0 0 0 4px var(--color-primary), 0 0 0 5px var(--color-background), 0 0 0 6px var(--color-primary)",
            );
        });
    });

    describe("Statistics", () => {
        it("should set the section headings in the pale Mono 500", () => {
            const heading = declarationsOf(BLUEPRINT_CSS, skin("stat-heading"));

            expect(heading.get("color")).toBe("var(--color-foreground-secondary)");
            expect(heading.get("font-weight")).toBe("500");
            expect(declarationsOf(BLUEPRINT_CSS, `${FONTS_READY} [data-skin~="stat-heading"]`).get("font-family")).toBe("var(--font-blueprint-mono)");
        });

        it("should set the figures in Mono 500, keeping the markup's primary on the best time", () => {
            const value = declarationsOf(BLUEPRINT_CSS, skin("stat-value"));

            expect(value.get("font-weight")).toBe("500");
            expect(value.get("color")).toBeUndefined();
        });

        it("should frame a recent game's row in 1.5px of ink on the paper, square", () => {
            const row = declarationsOf(BLUEPRINT_CSS, skin("recent-row"));

            expect(row.get("background-color")).toBe("var(--color-background)");
            expect(row.get("box-shadow")).toBe("var(--blueprint-frame-strong)");
            expect(row.get("border-radius")).toBe("0");
        });

        it("should write a game's result in the ink, a given-up one too", () => {
            expect(declarationsOf(BLUEPRINT_CSS, skin("game-result")).get("color")).toBe("var(--color-foreground)");
            expect(declarationsOf(BLUEPRINT_CSS, skin("game-result gave-up")).get("color")).toBeUndefined();
        });
    });

    describe("playback", () => {
        it("should rule the progress track as a 12px ruler on its ::before: a 1px line with a tick every 10%", () => {
            const track = declarationsOf(BLUEPRINT_CSS, skin("progress-track"));
            const ruler = declarationsOf(BLUEPRINT_CSS, `${skin("progress-track")}::before`);

            expect(track.get("position")).toBe("relative");
            expect(track.get("isolation")).toBe("isolate");
            expect(track.get("background-color")).toBe("transparent");
            expect(track.get("border-radius")).toBe("0");
            expect(ruler.get("content")).toBe('""');
            expect(ruler.get("position")).toBe("absolute");
            expect(ruler.get("height")).toBe("12px");
            expect(ruler.get("z-index")).toBe("-1");
            expect(ruler.get("background-image")).toBe("repeating-linear-gradient(90deg, var(--color-border) 0 1px, transparent 1px 10%)");
            expect(ruler.get("box-shadow")).toBe("inset 0 0 0 1px var(--color-border)");
            expect(ruler.get("pointer-events")).toBe("none");
        });

        it("should draw the progress as a 4px bar of the primary through the ruler's middle, sized by its background", () => {
            const fill = declarationsOf(BLUEPRINT_CSS, skin("progress-fill"));

            expect(fill.get("height")).toBeUndefined();
            expect(fill.get("border-radius")).toBe("0");
            expect(fill.get("background-color")).toBe("transparent");
            expect(fill.get("background-image")).toBe("linear-gradient(var(--color-primary), var(--color-primary))");
            expect(fill.get("background-size")).toBe("100% 4px");
            expect(fill.get("background-position")).toBe("0 50%");
            expect(fill.get("background-repeat")).toBe("no-repeat");
        });

        it("should draw the play button as a clear square key in a 1.5px line of the primary", () => {
            const play = declarationsOf(BLUEPRINT_CSS, skin("button play"));

            expect(play.get("background-color")).toBe("transparent");
            expect(play.get("box-shadow")).toBe("inset 0 0 0 1.5px var(--color-primary)");
            expect(play.get("color")).toBe("var(--color-primary)");
            expect(play.get("border-radius")).toBe("0");
        });

        it("should square the step dots in the pale ink, this step's filled with the primary and the ones passed half the pale ink", () => {
            const dot = declarationsOf(BLUEPRINT_CSS, skin("step-dot"));
            const current = declarationsOf(BLUEPRINT_CSS, skin("step-dot current"));
            const past = declarationsOf(BLUEPRINT_CSS, skin("step-dot past"));

            expect(dot.get("border-radius")).toBe("0");
            expect(dot.get("background-color")).toBe("transparent");
            expect(dot.get("box-shadow")).toBe("inset 0 0 0 1px var(--color-foreground-secondary)");
            expect(current.get("background-color")).toBe("var(--color-primary)");
            expect(current.get("box-shadow")).toBe("none");
            expect(past.get("background-color")).toBe("color-mix(in srgb, var(--color-foreground-secondary) 50%, transparent)");
            expect(past.get("box-shadow")).toBe("none");
        });
    });
});
