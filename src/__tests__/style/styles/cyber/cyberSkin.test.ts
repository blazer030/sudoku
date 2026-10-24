import { readFileSync } from "fs";
import postcss, { type AtRule, type Declaration, type Rule } from "postcss";
import { declarationsOf } from "../../styleSheetRules";

const CYBER_CSS = readFileSync("src/style/styles/cyber/skin.css", "utf8");

const SCOPE = '[data-style="cyber"]';
const FONTS_READY = '[data-style="cyber"][data-cyber-fonts="ready"]';
// The panels' paint weighs one pseudo-class more than a component's scoped styles (the hint panel's buttons)
const PAINT_SCOPE = ':root[data-style="cyber"]';

const skin = (token: string): string => `${SCOPE} [data-skin~="${token}"]`;
const paintOf = (token: string): Map<string, string> => declarationsOf(CYBER_CSS, `${PAINT_SCOPE} [data-skin~="${token}"]`);

const collapse = (text: string): string => text.replace(/\s+/g, " ").trim();

const allRules = (): Rule[] => {
    const rules: Rule[] = [];
    postcss.parse(CYBER_CSS).walkRules((rule) => {
        rules.push(rule);
    });
    return rules;
};

const allDeclarations = (property: RegExp): Declaration[] => {
    const declarations: Declaration[] = [];
    postcss.parse(CYBER_CSS).walkDecls(property, (declaration) => {
        declarations.push(declaration);
    });
    return declarations;
};

// The declarations of the rules inside an @media block whose params include `params`, listing `selector`
const mediaDeclarationsOf = (params: string, selector: string): Map<string, string> => {
    const declarations = new Map<string, string>();
    postcss.parse(CYBER_CSS).walkRules((rule) => {
        const parent = rule.parent;
        if (parent?.type !== "atrule" || (parent as AtRule).name !== "media" || !(parent as AtRule).params.includes(params)) return;
        if (!rule.selectors.map(collapse).includes(selector)) return;
        rule.walkDecls((declaration) => {
            declarations.set(declaration.prop, collapse(declaration.value));
        });
    });
    return declarations;
};

// Lit pieces: a deep magenta fill behind pink text, with a magenta edge
const LIT = {
    "a tile that is on": `${skin("tile")}[aria-pressed="true"]`,
    "a checked tile": `${skin("tile")}[aria-checked="true"]`,
    "the chosen key": `${skin("key")}[aria-pressed="true"]`,
    "an active game control": `${SCOPE} [aria-pressed="true"] > [data-skin~="control"]`,
    "a primary button": `${skin("button")}:is(.bg-primary, .hint-primary, [data-skin~="new-game"])`,
} as const;

describe("cyber skin", () => {
    describe("type", () => {
        it("should set digits in Orbitron, and the timer and notes in Share Tech Mono, once the faces have loaded", () => {
            const fonts = declarationsOf(CYBER_CSS, FONTS_READY);

            for (const token of ["--font-clue", "--font-entry", "--font-key"]) {
                expect(fonts.get(token), token).toBe("var(--font-cyber-digits)");
            }
            expect(fonts.get("--font-timer")).toBe("var(--font-cyber-mono)");
            expect(fonts.get("--font-note")).toBe("var(--font-cyber-mono)");
        });

        it("should set every other text in the system sans, without Outfit", () => {
            const sans = declarationsOf(CYBER_CSS, FONTS_READY).get("--font-sans") ?? "";

            expect(sans).toContain("PingFang TC");
            expect(sans).not.toContain("Outfit");
        });

        it("should repoint no font outside the fonts-ready gate", () => {
            const ungated = allDeclarations(/^--font-/).filter(declaration =>
                declaration.parent?.type !== "rule"
                || (declaration.parent as Rule).selectors.some(selector => !selector.trim().startsWith(FONTS_READY)));

            expect(ungated.map(declaration => declaration.prop)).toEqual([]);
        });
    });

    describe("panels", () => {
        const CUT = ["card", "button", "tile", "key", "control", "segmented", "pill", "tag", "board"];

        it.each(CUT)("should cut the corners of %s", (token) => {
            const ending = new RegExp(`\\[data-skin~="${token}"\\](?:::before|::after)?$`);
            const clipPaths = allRules()
                .filter(rule => rule.selectors.some(selector => ending.test(collapse(selector))))
                .flatMap(rule => rule.nodes.filter((node): node is Declaration => node.type === "decl" && node.prop === "clip-path"));

            expect(clipPaths.some(declaration => declaration.value.trim().startsWith("polygon("))).toBe(true);
        });

        it.each(["card", "button", "tile", "key", "control", "segmented", "segmented-indicator", "pill", "tag"])(
            "should draw %s as its edge around its fill",
            (token) => {
                const paint = paintOf(token);

                expect(paint.get("background"), token).toContain("var(--cyber-edge)");
                expect(paint.get("background"), token).toMatch(/var\(--cyber-fill\)$/);
                expect(paint.get("border-color"), token).toBe("transparent");
            },
        );

        it("should rest every panel on the card colour inside the cyan edge", () => {
            const rest = declarationsOf(CYBER_CSS, skin("card"));

            expect(rest.get("--cyber-edge")).toBe("var(--color-border)");
            expect(rest.get("--cyber-fill")).toBe("var(--color-card)");
        });

        it.each(Object.entries(LIT))("should light %s as a deep magenta fill behind pink text", (_name, selector) => {
            const lit = declarationsOf(CYBER_CSS, selector);

            expect(lit.get("--cyber-fill")).toBe("var(--color-primary-light)");
            expect(lit.get("--cyber-edge")).toBe("var(--color-primary)");
            expect(lit.get("color")).toBe("var(--color-primary-ink)");
        });

        it("should light the chosen segment: a deep magenta indicator under pink text", () => {
            const indicator = declarationsOf(CYBER_CSS, skin("segmented-indicator"));

            expect(indicator.get("--cyber-fill")).toBe("var(--color-primary-light)");
            expect(indicator.get("--cyber-edge")).toBe("var(--color-primary)");
            expect(declarationsOf(CYBER_CSS, `${skin("segmented")} > [aria-pressed="true"]`).get("color")).toBe("var(--color-primary-ink)");
        });

        it("should put no text on a bright magenta or yellow block, except the remaining-count badge", () => {
            const BRIGHT = /var\(--color-(?:primary|signal)\)/;
            const offenders = allRules()
                .filter(rule => !rule.selectors.some(selector => selector.includes('[data-skin~="badge"]')))
                .filter((rule) => {
                    const declarations = rule.nodes.filter((node): node is Declaration => node.type === "decl");
                    const bright = declarations.some(declaration =>
                        ["background", "background-color", "--cyber-fill"].includes(declaration.prop) && BRIGHT.test(declaration.value));
                    return bright && declarations.some(declaration => declaration.prop === "color");
                })
                .map(rule => rule.selector);

            expect(offenders).toEqual([]);
        });

        it.each([
            ["the hint-mode pill", `${skin("pill")}[data-skin~="hint"]`],
            ["the new-record badge", `${skin("tag")}[data-skin~="new-record"]`],
        ])("should draw %s as a deep yellow fill behind yellow text", (_name, selector) => {
            const yellow = declarationsOf(CYBER_CSS, selector);

            expect(yellow.get("--cyber-fill")).toBe("var(--color-signal-surface)");
            expect(yellow.get("--cyber-edge")).toBe("var(--color-signal)");
            expect(yellow.get("color")).toBe("var(--color-signal)");
        });

        it("should draw the danger button as a deep red fill behind red text, in a red edge", () => {
            const danger = declarationsOf(CYBER_CSS, `${skin("button")}.bg-danger`);

            expect(danger.get("--cyber-fill")).toBe("var(--color-error-surface)");
            expect(danger.get("--cyber-edge")).toBe("var(--color-error)");
            expect(danger.get("color")).toBe("var(--color-error)");
        });

        it("should draw the remaining-count badge as a notched yellow tag with near-black digits", () => {
            const badge = declarationsOf(CYBER_CSS, skin("badge"));

            expect(badge.get("background-color")).toBe("var(--color-signal)");
            expect(badge.get("color")).toBe("var(--color-background)");
            expect(badge.get("clip-path")).toMatch(/^polygon\(/);
        });

        it("should glow a hovered piece in its own edge colour, so a lit piece glows brighter", () => {
            const hovered = mediaDeclarationsOf("(hover: hover)", `${skin("key")}:enabled:hover`);

            expect(hovered.get("--cyber-hover-glow")).toMatch(/var\(--cyber-edge\)/);
            expect(paintOf("key").get("box-shadow")).toContain("var(--cyber-hover-glow, transparent)");
        });
    });

    describe("pages", () => {
        it.each(["::before", "::after"])("should hang the page decoration %s under the content, never taking taps", (pseudo) => {
            const decoration = declarationsOf(CYBER_CSS, `${skin("page")}${pseudo}`);

            expect(decoration.get("content")).toBe('""');
            expect(decoration.get("position")).toBe("fixed");
            expect(decoration.get("pointer-events")).toBe("none");
            expect(Number(decoration.get("z-index"))).toBeLessThan(0);
            // The page is its own stacking context, so the decoration sits over its background and under its content
            expect(declarationsOf(CYBER_CSS, skin("page")).get("isolation")).toBe("isolate");
        });

        it("should hang the same decoration behind the pages that do not paint their own background", () => {
            expect(declarationsOf(CYBER_CSS, `${SCOPE} .app-safe-area::before`).get("position")).toBe("fixed");
            expect(declarationsOf(CYBER_CSS, `${SCOPE} .app-safe-area::before`)).toEqual(declarationsOf(CYBER_CSS, `${skin("page")}::before`));
            expect(declarationsOf(CYBER_CSS, `${SCOPE} .app-safe-area::after`)).toEqual(declarationsOf(CYBER_CSS, `${skin("page")}::after`));
        });

        it("should lay the perspective floor at the bottom of the screen, fading upwards", () => {
            const floor = declarationsOf(CYBER_CSS, `${skin("page")}::after`);

            expect(floor.get("transform")).toMatch(/^perspective\(\d+px\) rotateX\(\d+deg\)$/);
            expect(floor.get("mask-image")).toMatch(/^linear-gradient\(to top, /);
        });
    });

    describe("board", () => {
        it("should frame the board in a cyan-to-magenta gradient with 16px cut corners", () => {
            const board = paintOf("board");

            expect(board.get("background")).toMatch(/linear-gradient\(135deg, var\(--cyber-frame-from\), var\(--color-primary\)\)$/);
            expect(declarationsOf(CYBER_CSS, skin("board")).get("--cyber-frame-from")).toBe("var(--color-accent)");
            expect(board.get("clip-path")).toContain("16px");
        });

        it("should draw magenta box lines and faint cyan cell lines", () => {
            const scope = declarationsOf(CYBER_CSS, SCOPE);

            expect(scope.get("--board-box-line")).toBe("var(--color-primary)");
            expect(scope.get("--board-line")).toBe("color-mix(in srgb, var(--color-accent) 16%, transparent)");
        });

        it("should tag the board GRID 9×9 at the top left, in the mono face on the page colour", () => {
            const tag = declarationsOf(CYBER_CSS, `${skin("board")}::before`);

            expect(tag.get("content")).toContain('"GRID 9×9"');
            expect(tag.get("pointer-events")).toBe("none");
            expect(tag.get("font-family")).toBe("var(--cyber-mono)");
            expect(tag.get("background-color")).toBe("var(--color-background)");
        });

        it("should name the selected cell at the bottom right only while a cell is selected", () => {
            const tag = declarationsOf(CYBER_CSS, `${skin("board")}[data-selected-cell]::after`);

            expect(tag.get("content")).toContain('"CELL " attr(data-selected-cell)');
            expect(tag.get("pointer-events")).toBe("none");
            // Without the attribute there is no tag at all, rather than an empty 「CELL 」
            expect(declarationsOf(CYBER_CSS, `${skin("board")}::after`).get("content")).toBeUndefined();
        });
    });

    describe("Home", () => {
        it("should drop the logo's filled square and light the diagonal squares in magenta", () => {
            const logo = declarationsOf(CYBER_CSS, skin("logo"));
            const lit = declarationsOf(CYBER_CSS, `${skin("logo")} > * > :nth-child(4n + 1)`);

            expect(logo.get("background-color")).toBe("transparent");
            expect(declarationsOf(CYBER_CSS, `${skin("logo")} > * > *`).get("background-color")).toBe("transparent");
            expect(lit.get("background-color")).toBe("var(--color-primary)");
        });

        it("should mark the logo SYS://SUDOKU in cyan mono", () => {
            const mark = declarationsOf(CYBER_CSS, `${skin("logo")}::after`);

            expect(mark.get("content")).toContain('"SYS://SUDOKU"');
            expect(mark.get("color")).toBe("var(--color-accent)");
            expect(mark.get("font-family")).toBe("var(--cyber-mono)");
        });

        it("should split the title's shadow into magenta and cyan", () => {
            expect(declarationsOf(CYBER_CSS, skin("title")).get("text-shadow")).toBe("2px 0 var(--color-primary), -2px 0 var(--color-accent)");
            expect(declarationsOf(CYBER_CSS, skin("title-glyph")).get("margin-inline")).toBe("0.12em");
        });
    });

    describe("Settings", () => {
        it("should number the group headings 01, 02, … in the mono face", () => {
            const number = declarationsOf(CYBER_CSS, `${skin("group-heading")}::after`);

            expect(number.get("counter-increment")).toBe("cyber-group");
            expect(number.get("content")).toContain("counter(cyber-group, decimal-leading-zero)");
            expect(number.get("font-family")).toBe("var(--cyber-mono)");
            expect(declarationsOf(CYBER_CSS, skin("page")).get("counter-reset")).toBe("cyber-group");
        });

        it("should draw a toggle's mark as a short bar that glows in the primary when on", () => {
            const on = declarationsOf(CYBER_CSS, `${skin("tile")}[aria-pressed="true"] [data-skin~="check"]`);

            expect(declarationsOf(CYBER_CSS, skin("check")).get("background-size")).toBe("100% 6px");
            expect(on.get("--cyber-indicator")).toBe("var(--color-primary)");
            expect(on.get("filter")).toMatch(/^drop-shadow\(.*var\(--color-primary\)\)$/);
        });

        it("should separate a card's rows with dashed edge lines", () => {
            const rows = declarationsOf(CYBER_CSS, `${skin("card")} .divide-y > *`);

            expect(rows.get("border-style")).toBe("dashed");
            expect(rows.get("border-color")).toBe("var(--color-border)");
        });
    });
});
