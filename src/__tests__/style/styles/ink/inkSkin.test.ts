import { readFileSync } from "fs";
import postcss, { type AtRule } from "postcss";
import { declarationsOf } from "../../styleSheetRules";

const INK_CSS = readFileSync("src/style/styles/ink/skin.css", "utf8");
const BRUSH_GRID_SVG = readFileSync("src/style/styles/ink/brush-grid.svg", "utf8");
const WASHI_FIBRES_SVG = readFileSync("src/style/styles/ink/washi-fibres.svg", "utf8");
const HOME_MOUNTAINS_SVG = readFileSync("src/style/styles/ink/home-mountains.svg", "utf8");

const SCOPE = '[data-style="ink"]';
const FONTS_READY = '[data-style="ink"][data-ink-fonts="ready"]';
const BOARD = `${SCOPE} [data-skin~="board"]`;
const GRID = `${SCOPE} [data-skin~="board-grid"]`;
const RING = "inset 0 0 0 1px var(--color-primary-ink)";
// Through the alias: a path relative to skin.css is lost once the sheet is inlined into index.css and
// minified, so a production build would look for the file beside index.css
const BRUSH_GRID_URL = 'url("@/style/styles/ink/brush-grid.svg")';
const WASHI_FIBRES_URL = 'url("@/style/styles/ink/washi-fibres.svg")';
const HOME_MOUNTAINS_URL = 'url("@/style/styles/ink/home-mountains.svg")';
const RAW_COLOUR = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|\bwhite\b|\bblack\b/;
const WASHI_SURFACE = "color-mix(in srgb, var(--color-card) 62%, transparent)";
const EDGE_LINE = "inset 0 0 0 1px var(--color-border)";
const ROOT_PAGE = `${SCOPE} [data-skin~="page-ruled"]`;
const NESTED_PAGE = `${SCOPE} [data-skin~="page-ruled"] [data-skin~="page-ruled"]`;
const LOGO = `${SCOPE} [data-skin~="logo"]`;
// The pieces v-press washes by a background-image; none of them may set one of its own
const PRESSABLE_TOKENS = ["card", "tile", "key", "button", "control", "segment", "chip", "continue", "new-game"];

const collapse = (text: string): string => text.replace(/\s+/g, " ").trim();

// Every rule outside @keyframes, with its collapsed selectors and declarations
const allRules = (): { selectors: string[]; declarations: Map<string, string> }[] => {
    const rules: { selectors: string[]; declarations: Map<string, string> }[] = [];
    postcss.parse(INK_CSS).walkRules((rule) => {
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

const parseSvg = (source: string): Document => new DOMParser().parseFromString(source, "image/svg+xml");

// The declarations of the rules inside an @supports block on mask images that list `selector`
const maskSupportsDeclarationsOf = (selector: string): Map<string, string> => {
    const declarations = new Map<string, string>();
    postcss.parse(INK_CSS).walkRules((rule) => {
        const parent = rule.parent;
        if (parent?.type !== "atrule" || (parent as AtRule).name !== "supports") return;
        const params = (parent as AtRule).params;
        if (!params.includes("-webkit-mask-image") || !params.replace("-webkit-mask-image", "").includes("mask-image")) return;
        if (!rule.selectors.map(collapse).includes(selector)) return;
        rule.walkDecls((declaration) => {
            declarations.set(declaration.prop, collapse(declaration.value));
        });
    });
    return declarations;
};

describe("ink skin", () => {
    describe("brush grid", () => {
        it("should paint the brush lines in ink through the mask, for WebKit as well as the rest", () => {
            const lines = maskSupportsDeclarationsOf(`${GRID}::after`);

            expect(lines.get("-webkit-mask-image")).toBe(BRUSH_GRID_URL);
            expect(lines.get("mask-image")).toBe(BRUSH_GRID_URL);
            expect(lines.get("background-color")).toBe("var(--color-foreground)");
        });

        it("should lay the brush lines over the cells, so they land on the cell edges, above the digits, never taking taps", () => {
            const lines = maskSupportsDeclarationsOf(`${GRID}::after`);

            expect(lines.get("inset")).toBe("0");
            expect(lines.get("z-index")).toBe("3");
            expect(lines.get("pointer-events")).toBe("none");
        });

        it("should hide the plain cell lines and the grid's border only where masks are supported", () => {
            const masked = maskSupportsDeclarationsOf(GRID);
            const plain = declarationsOf(INK_CSS, GRID);

            expect(masked.get("--board-line")).toBe("transparent");
            expect(masked.get("--board-box-line")).toBe("transparent");
            expect(masked.get("border-color")).toBe("transparent");
            expect([plain.get("--board-line"), plain.get("--board-box-line"), plain.get("border-color")]).not.toContain("transparent");
        });

        it("should draw nothing over the board where masks are not supported", () => {
            expect(declarationsOf(INK_CSS, `${GRID}::after`).size).toBe(0);
        });

        it("should lay the board and its plain cells bare on the page, without a shadow", () => {
            const board = declarationsOf(INK_CSS, BOARD);

            expect(board.get("background-color")).toBe("transparent");
            expect(board.get("box-shadow")).toBe("none");
            for (const variant of ["default", "clue"]) {
                const cell = declarationsOf(INK_CSS, `${BOARD} [data-variant="${variant}"]`);
                expect(cell.get("background-color"), variant).toBe("transparent");
                expect(cell.get("box-shadow"), variant).toBe("none");
            }
        });

        describe("brush-grid.svg", () => {
            const svg = new DOMParser().parseFromString(BRUSH_GRID_SVG, "image/svg+xml");

            it("should parse as a 351×351 drawing", () => {
                expect(svg.getElementsByTagName("parsererror")).toHaveLength(0);
                expect(svg.documentElement.getAttribute("viewBox")).toBe("0 0 351 351");
            });

            it("should roughen the lines with one turbulence displacement filter", () => {
                const filters = svg.getElementsByTagName("filter");
                const turbulence = svg.getElementsByTagName("feTurbulence")[0];
                const displacement = svg.getElementsByTagName("feDisplacementMap")[0];

                expect(filters).toHaveLength(1);
                expect(turbulence.getAttribute("baseFrequency")).toBe("0.85");
                expect(turbulence.getAttribute("numOctaves")).toBe("2");
                expect(turbulence.getAttribute("seed")).toBe("4");
                expect(displacement.getAttribute("scale")).toBe("2.6");
            });

            it("should draw twelve pale cell lines, four box lines and the four sides of the frame", () => {
                const paths = Array.from(svg.getElementsByTagName("path"));
                const opacities = paths.map(path => path.getAttribute("opacity") ?? "1");

                expect(paths).toHaveLength(20);
                expect(opacities.filter(opacity => opacity === ".32")).toHaveLength(12);
                expect(opacities.filter(opacity => opacity === ".9")).toHaveLength(4);
                expect(opacities.filter(opacity => opacity === "1")).toHaveLength(4);
            });

            it("should carry only alpha: every shape in currentColor", () => {
                expect(BRUSH_GRID_SVG).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
                expect(svg.getElementsByTagName("g")[0].getAttribute("fill")).toBe("currentColor");
            });
        });
    });

    describe("washi pages", () => {
        it("should paint the app's page scroller as washi: the page colour under layers of light, grain and dots", () => {
            const washi = declarationsOf(INK_CSS, ROOT_PAGE);

            expect(washi.get("background-color")).toBe("var(--color-background)");
            expect(washi.get("background-image")?.match(/gradient\(/g)?.length).toBeGreaterThanOrEqual(4);
            expect(washi.get("background-image")).not.toMatch(RAW_COLOUR);
        });

        it("should lay the fibres over the washi, fixed to the screen, below every content layer and never taking taps", () => {
            const fibres = declarationsOf(INK_CSS, `${ROOT_PAGE}::before`);

            expect(fibres.get("position")).toBe("fixed");
            expect(fibres.get("pointer-events")).toBe("none");
            expect(fibres.get("z-index")).toBe("-1");
            expect(fibres.get("-webkit-mask-image")).toBe(WASHI_FIBRES_URL);
            expect(fibres.get("mask-image")).toBe(WASHI_FIBRES_URL);
            // Its own stacking context, so a layer below content still lies above the washi
            expect(declarationsOf(INK_CSS, ROOT_PAGE).get("isolation")).toBe("isolate");
        });

        it("should leave a page nested in the scroller clear, without a second copy of the fibres", () => {
            expect(declarationsOf(INK_CSS, NESTED_PAGE).get("background")).toBe("transparent");
            expect(declarationsOf(INK_CSS, `${NESTED_PAGE}::before`).get("content")).toBe("none");
            expect(declarationsOf(INK_CSS, `${SCOPE} [data-skin~="page"]`).get("background-color")).toBe("transparent");
        });

        it("should keep a sticky page header clear at rest, so the washi runs through it", () => {
            expect(declarationsOf(INK_CSS, `${SCOPE} [data-skin~="page-header"]`).get("background-color")).toBe("transparent");
        });

        describe("washi-fibres.svg", () => {
            const svg = parseSvg(WASHI_FIBRES_SVG);

            it("should stretch over the whole screen: the drawing keeps no aspect ratio and the mask fills the layer", () => {
                const fibres = declarationsOf(INK_CSS, `${ROOT_PAGE}::before`);

                expect(svg.getElementsByTagName("parsererror")).toHaveLength(0);
                expect(svg.documentElement.getAttribute("preserveAspectRatio")).toBe("none");
                expect(fibres.get("mask-size")).toBe("100% 100%");
                expect(fibres.get("-webkit-mask-size")).toBe("100% 100%");
            });

            it("should draw only currentColor strands", () => {
                expect(svg.getElementsByTagName("g")[0].getAttribute("stroke")).toBe("currentColor");
                expect(WASHI_FIBRES_SVG).not.toMatch(RAW_COLOUR);
            });
        });
    });

    describe("Home", () => {
        it("should turn the logo into a vermilion seal reading 數獨, turned a little, with an inner paper ring", () => {
            const seal = declarationsOf(INK_CSS, `${LOGO}::after`);

            expect(seal.get("content")).toContain('"數獨"');
            expect(seal.get("background-color")).toBe("var(--color-primary)");
            expect(seal.get("color")).toBe("var(--color-on-primary)");
            expect(seal.get("font-weight")).toBe("900");
            expect(seal.get("writing-mode")).toBe("vertical-rl");
            expect(seal.get("rotate")).toBe("-4deg");
            expect(seal.get("box-shadow")).toContain("var(--color-on-primary)");
            expect(declarationsOf(INK_CSS, `${FONTS_READY} [data-skin~="logo"]::after`).get("font-family")).toBe("var(--font-ink-serif)");
        });

        it("should hide the logo's own grid and leave its box unturned, so the mountains can be fixed to the screen", () => {
            const logo = declarationsOf(INK_CSS, LOGO);

            expect(declarationsOf(INK_CSS, `${LOGO} > *`).get("opacity")).toBe("0");
            expect(logo.get("background-color")).toBe("transparent");
            expect(logo.get("transform") ?? "none").toBe("none");
            expect(logo.get("rotate")).toBeUndefined();
        });

        it("should lay the misty mountains along the bottom of the screen, below every content layer and never taking taps", () => {
            const mountains = declarationsOf(INK_CSS, `${LOGO}::before`);

            expect(mountains.get("position")).toBe("fixed");
            expect(mountains.get("bottom")).toBe("0");
            expect(mountains.get("pointer-events")).toBe("none");
            expect(mountains.get("z-index")).toBe("-1");
            expect(mountains.get("background-color")).toBe("var(--color-foreground)");
            expect(mountains.get("-webkit-mask-image")).toBe(HOME_MOUNTAINS_URL);
            expect(mountains.get("mask-image")).toBe(HOME_MOUNTAINS_URL);
        });

        it("should join the continue card's chips with a vermilion ・, as plain text", () => {
            const dot = declarationsOf(INK_CSS, `${SCOPE} [data-skin~="chip"] + [data-skin~="chip"]::before`);
            const chip = declarationsOf(INK_CSS, `${SCOPE} [data-skin~="chip"]`);

            expect(dot.get("content")).toContain('"・"');
            expect(dot.get("color")).toBe("var(--color-primary-ink)");
            expect(chip.get("background-color")).toBe("transparent");
        });

        it("should make the new-game button the seal, with an inner paper ring, whether or not a game is saved", () => {
            const button = declarationsOf(INK_CSS, `${SCOPE} [data-skin~="button"][data-skin~="new-game"]`);

            expect(button.get("background-color")).toBe("var(--color-primary)");
            expect(button.get("color")).toBe("var(--color-on-primary)");
            expect(button.get("box-shadow")).toContain("var(--color-on-primary)");
        });

        describe("home-mountains.svg", () => {
            const svg = parseSvg(HOME_MOUNTAINS_SVG);

            it("should draw its ranges back to front, each nearer one darker, all of them faint", () => {
                const opacities = Array.from(svg.getElementsByTagName("path")).map(path => Number(path.getAttribute("opacity")));

                expect(svg.getElementsByTagName("parsererror")).toHaveLength(0);
                expect(opacities.length).toBeGreaterThan(1);
                expect(opacities.slice(1).every((opacity, index) => opacity > opacities[index])).toBe(true);
                expect(Math.max(...opacities)).toBeLessThan(0.5);
            });

            it("should stretch along the bottom of the screen: the drawing keeps no aspect ratio and the mask fills the layer", () => {
                const mountains = declarationsOf(INK_CSS, `${LOGO}::before`);

                expect(svg.documentElement.getAttribute("preserveAspectRatio")).toBe("none");
                expect(mountains.get("mask-size")).toBe("100% 100%");
                expect(mountains.get("-webkit-mask-size")).toBe("100% 100%");
            });

            it("should soften the ranges with one blur, drawn into the image", () => {
                expect(svg.getElementsByTagName("filter")).toHaveLength(1);
                expect(svg.getElementsByTagName("feGaussianBlur")).toHaveLength(1);
            });

            it("should carry only alpha: every shape in currentColor", () => {
                expect(HOME_MOUNTAINS_SVG).not.toMatch(RAW_COLOUR);
                expect(svg.getElementsByTagName("g")[0].getAttribute("fill")).toBe("currentColor");
            });
        });
    });

    describe("type", () => {
        it("should brush only the Home title, the completion title and the dialog titles, once the faces have loaded", () => {
            const brushed = allRules()
                .filter(rule => Array.from(rule.declarations.values()).some(value => value.includes("--font-ink-brush")))
                .flatMap(rule => rule.selectors);

            expect(brushed.sort()).toEqual([
                `${FONTS_READY} [data-skin~="complete-title"]`,
                `${FONTS_READY} [data-skin~="dialog-title"]`,
                `${FONTS_READY} [data-skin~="title"]`,
            ]);
        });

        it("should set the mono figures (statistics, times) in the board's digit face, once the faces have loaded", () => {
            const fonts = declarationsOf(INK_CSS, FONTS_READY);

            expect(fonts.get("--font-mono")).toBe(fonts.get("--font-clue"));
        });

        it("should set every other text in the seal's serif, not the brush, once the faces have loaded", () => {
            const fonts = declarationsOf(INK_CSS, FONTS_READY);
            const seal = declarationsOf(INK_CSS, `${FONTS_READY} [data-skin~="logo"]::after`);

            expect(fonts.get("--font-sans")).toBe(seal.get("font-family"));
            expect(fonts.get("--font-sans")).not.toContain("--font-ink-brush");
        });
    });

    describe("surfaces", () => {
        it.each(["card", "tile", "key"])("should lay a %s on the washi as translucent paper with a 1px edge line", (token) => {
            const surface = declarationsOf(INK_CSS, `${SCOPE} [data-skin~="${token}"]`);

            expect(surface.get("background-color")).toBe(WASHI_SURFACE);
            expect(surface.get("box-shadow")).toBe(EDGE_LINE);
        });

        it("should give dialogs and floating panels solid paper, so the page under them does not show through", () => {
            const floating = declarationsOf(INK_CSS, `${SCOPE} [data-skin~="card"]:is(.shadow-modal, .shadow-popup, .shadow-card-lg)`);

            expect(floating.get("background-color")).toBe("var(--color-card)");
            expect(floating.get("box-shadow")).toContain(EDGE_LINE);
        });

        it("should give no pressable piece a background-image of its own, so the press wash is never painted over", () => {
            const offending = allRules().flatMap(rule => rule.selectors
                .filter(selector => !isPseudoElement(selector))
                .filter(selector => PRESSABLE_TOKENS.some(token => selector.includes(`[data-skin~="${token}"]`)))
                .filter(() => rule.declarations.has("background-image") || rule.declarations.has("background")));

            expect(offending).toEqual([]);
        });

        it("should fog the loader's backdrop in the page colour, not the ink scrim", () => {
            expect(declarationsOf(INK_CSS, `${SCOPE} [data-skin~="loader-scrim"]`).get("background-color"))
                .toBe("color-mix(in srgb, var(--color-background) 66%, transparent)");
        });
    });

    describe("keypad", () => {
        it("should press the chosen key as a seal, turned −3°", () => {
            const chosen = declarationsOf(INK_CSS, `${SCOPE} [data-skin~="key"][aria-pressed="true"]`);

            expect(chosen.get("background-color")).toBe("var(--color-primary)");
            expect(chosen.get("color")).toBe("var(--color-on-primary)");
            expect(chosen.get("rotate")).toBe("-3deg");
        });

        it("should fade a finished key to 30%", () => {
            expect(declarationsOf(INK_CSS, `${SCOPE} [data-skin~="key"]:disabled`).get("opacity")).toBe("0.3");
        });

        it("should draw the remaining-count badge as a page-coloured disc with a vermilion ring and digits", () => {
            const badge = declarationsOf(INK_CSS, `${SCOPE} [data-skin~="badge"]`);

            expect(badge.get("background-color")).toBe("var(--color-background)");
            expect(badge.get("box-shadow")).toBe("inset 0 0 0 1px var(--color-primary-ink)");
            expect(badge.get("color")).toBe("var(--color-primary-ink)");
        });
    });

    describe("choices", () => {
        it("should underline the chosen segment (the chosen difficulty too) with a vermilion brush stroke instead of a fill", () => {
            const stroke = declarationsOf(INK_CSS, `${SCOPE} [data-skin~="segment"][aria-pressed="true"]::after`);

            expect(stroke.get("content")).toBe('""');
            expect(stroke.get("position")).toBe("absolute");
            expect(stroke.get("background-color")).toBe("var(--color-primary)");
            expect(declarationsOf(INK_CSS, `${SCOPE} [data-skin~="segment"][aria-pressed="true"]`).get("color")).toBe("var(--color-foreground)");
            expect(declarationsOf(INK_CSS, `${SCOPE} [data-skin~="segmented"][data-skin~="menu"] [data-skin~="segmented-indicator"]`).get("background-color")).toBe("transparent");
        });

        it("should turn a toggle's mark into a small square that becomes a seal turned −8° when on", () => {
            const off = declarationsOf(INK_CSS, `${SCOPE} [data-skin~="check"]`);
            const on = declarationsOf(INK_CSS, `${SCOPE} [data-skin~="tile"][aria-pressed="true"] [data-skin~="check"]`);

            expect(off.get("border-radius")).toBe("3px");
            expect(on.get("background-color")).toBe("var(--color-primary)");
            expect(on.get("rotate")).toBe("-8deg");
        });

        it("should outline a chosen tile in vermilion instead of filling it", () => {
            const chosen = declarationsOf(INK_CSS, `${SCOPE} [data-skin~="tile"][aria-pressed="true"]`);

            expect(chosen.get("background-color")).toBe(WASHI_SURFACE);
            expect(chosen.get("box-shadow")).toContain("var(--color-primary-ink)");
            expect(chosen.get("color")).toBe("var(--color-foreground)");
        });
    });

    describe("digits", () => {
        it("should set clues, the player's digits, keys, the timer and notes in Garamond once the faces have loaded", () => {
            const fonts = declarationsOf(INK_CSS, FONTS_READY);

            for (const token of ["--font-clue", "--font-entry", "--font-key", "--font-timer", "--font-note"]) {
                expect(fonts.get(token), token).toBe("var(--font-ink-digits)");
            }
        });

        it("should write the player's digits in blue-black italic", () => {
            const entered = declarationsOf(INK_CSS, `${BOARD} [data-value-kind="entered"] > div`);

            expect(entered.get("color")).toBe("var(--color-accent)");
            expect(entered.get("font-style")).toBe("italic");
        });

        it("should keep a wrong digit in the error ink", () => {
            for (const variant of ["error", "wrong"]) {
                expect(declarationsOf(INK_CSS, `${BOARD} [data-variant="${variant}"][data-value-kind="entered"] > div`).get("color"), variant)
                    .toBe("var(--color-error)");
            }
        });

        it("should set lining figures on the board, never old-style ones", () => {
            expect(declarationsOf(INK_CSS, `${BOARD} [data-variant]`).get("font-variant-numeric")).toContain("lining-nums");
            expect(INK_CSS).not.toContain("oldstyle-nums");
        });

        it("should keep digits and notes above the group brush and below the brush lines", () => {
            expect(declarationsOf(INK_CSS, `${BOARD} [data-variant] > div`).get("z-index")).toBe("2");
        });

        it("should write the same digit in vermilion", () => {
            expect(declarationsOf(INK_CSS, `${BOARD} [data-variant="same-digit"][data-value-kind] > div`).get("color"))
                .toBe("var(--color-primary-ink)");
        });
    });

    describe("圓相", () => {
        it.each([
            ["the selected cell", `${BOARD}:not([data-hint-mode]) [data-selected]::after`],
            ["a hint's answer cell", `${BOARD} [data-variant="answer"]::after`],
        ])("should ring %s in a vermilion brush circle open at the top, above the brush lines", (_name, selector) => {
            const circle = declarationsOf(INK_CSS, selector);

            expect(circle.get("border-radius")).toBe("50%");
            expect(circle.get("border")).toContain("var(--color-primary)");
            expect(circle.get("border-top-color")).toBe("transparent");
            expect(circle.get("transform")).toContain("rotate(-28deg)");
            expect(circle.get("z-index")).toBe("4");
            expect(circle.get("pointer-events")).toBe("none");
        });

        it.each(["selected", "answer"])("should give the %s cell no shared ring and no fill", (variant) => {
            const cell = declarationsOf(INK_CSS, `${BOARD} [data-variant="${variant}"]`);

            expect(cell.get("box-shadow")).toBe("none");
            expect(cell.get("background-color")).toBe("transparent");
        });
    });

    describe("notes", () => {
        it("should write the selected digit's note in vermilion, without the disc", () => {
            const note = declarationsOf(INK_CSS, `${BOARD} [data-note-highlight]`);

            expect(note.get("color")).toBe("var(--color-primary-ink)");
            expect(note.get("background-color")).toBe("transparent");
        });

        it("should write a hint's candidates in blue-black italic", () => {
            const candidate = declarationsOf(INK_CSS, `${BOARD} .font-note.text-primary`);

            expect(candidate.get("color")).toBe("var(--color-accent)");
            expect(candidate.get("font-style")).toBe("italic");
        });

        it("should write a hint's eliminated candidates in vermilion", () => {
            expect(declarationsOf(INK_CSS, `${BOARD} .font-note.strike-diagonal`).get("color")).toBe("var(--color-primary-ink)");
        });

        it("should ring a hint's emphasised candidates thinly in vermilion, without a fill", () => {
            const emphasised = declarationsOf(INK_CSS, `${BOARD} :is([data-variant="answer"], [data-variant="pattern"]) [data-note-highlight]`);

            expect(emphasised.get("box-shadow")).toBe(RING);
            expect(emphasised.get("background-color") ?? "transparent").toBe("transparent");
        });
    });
});
