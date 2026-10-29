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
        it.each(["card", "button", "pill", "tag", "icon-tile", "toast", "menu-option"])("should square the corners of a %s", (token) => {
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
});
