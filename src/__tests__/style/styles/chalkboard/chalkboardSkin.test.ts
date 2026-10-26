import { readFileSync } from "fs";
import postcss, { type AtRule, type Rule } from "postcss";
import { ARRIVAL_SETTLE_MS } from "@/presentation/components/board-cell/useArrivalMotion";
import { animationTimingOf, declarationsOf, reducedMotionDeclarationsOf } from "../../styleSheetRules";

const CHALKBOARD_CSS = readFileSync("src/style/styles/chalkboard/skin.css", "utf8");
const GRID_SVG = readFileSync("src/style/styles/chalkboard/chalkboard-grid.svg", "utf8");
const RING_SVG = readFileSync("src/style/styles/chalkboard/chalkboard-ring.svg", "utf8");
const GRAIN_SVG = readFileSync("src/style/styles/chalkboard/chalkboard-grain.svg", "utf8");
const SMEARS_SVG = readFileSync("src/style/styles/chalkboard/chalkboard-smears.svg", "utf8");
const SWOOSH_SVG = readFileSync("src/style/styles/chalkboard/chalkboard-swoosh.svg", "utf8");

const SCOPE = '[data-style="chalkboard"]';
// 黑板: the codebase's dark mode selector
const DARK = ':root.dark[data-style="chalkboard"]';
const FONTS_READY = `${SCOPE}[data-chalkboard-fonts="ready"]`;
const BOARD = `${SCOPE} [data-skin~="board"]`;
const DARK_BOARD = `${DARK} [data-skin~="board"]`;
const GRID = `${SCOPE} [data-skin~="board-grid"]`;
const DARK_GRID = `${DARK} [data-skin~="board-grid"]`;
const DIGITS = `${BOARD} [data-variant] > div`;
const SELECTED_RING = `${BOARD}:not([data-hint-mode]) [data-selected]::after`;
const ANSWER_RING = `${BOARD} [data-variant="answer"]::after`;
// Through the alias: a path relative to skin.css is lost once the sheet is inlined into index.css and
// minified, so a production build would look for the file beside index.css
const GRID_URL = 'url("@/style/styles/chalkboard/chalkboard-grid.svg")';
const RING_URL = 'url("@/style/styles/chalkboard/chalkboard-ring.svg")';
const GRAIN_URL = 'url("@/style/styles/chalkboard/chalkboard-grain.svg")';
const SMEARS_URL = 'url("@/style/styles/chalkboard/chalkboard-smears.svg")';
const SWOOSH_URL = 'url("@/style/styles/chalkboard/chalkboard-swoosh.svg")';
const GRAIN = "var(--chalkboard-grain)";
const ROOT_PAGE = `${SCOPE} [data-skin~="page-ruled"]`;
const DARK_ROOT_PAGE = `${DARK} [data-skin~="page-ruled"]`;
const NESTED_PAGE = `${SCOPE} [data-skin~="page-ruled"] [data-skin~="page-ruled"]`;
const DARK_NESTED_PAGE = `${DARK} [data-skin~="page-ruled"] [data-skin~="page-ruled"]`;
const LOGO = `${SCOPE} [data-skin~="logo"]`;
const TITLE = `${SCOPE} [data-skin~="title"]`;
const CHOSEN_KEY = `${SCOPE} [data-skin~="key"][aria-pressed="true"]`;
// The canvas's uneven chalk corners (--wob)
const WOBBLY_CORNERS = "var(--chalkboard-wob)";
const CHALK_OUTLINE = /^inset 0 0 0 [\d.]+px var\(--color-border\)$/;
// The pieces v-press washes by a background-image; none of them may set one of its own
const PRESSABLE_TOKENS = ["card", "tile", "key", "button", "control", "segment", "chip", "continue", "new-game"];
const RAW_COLOUR = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|\bwhite\b|\bblack\b/;

const collapse = (text: string): string => text.replace(/\s+/g, " ").trim();

const isInMaskSupports = (rule: Rule): boolean => {
    const parent = rule.parent;
    if (parent?.type !== "atrule" || (parent as AtRule).name !== "supports") return false;
    const params = (parent as AtRule).params;
    return params.includes("-webkit-mask-image") && params.replace("-webkit-mask-image", "").includes("mask-image");
};

// The declarations of the rules inside an @supports block on mask images that list `selector`
const maskSupportsDeclarationsOf = (selector: string): Map<string, string> => {
    const declarations = new Map<string, string>();
    postcss.parse(CHALKBOARD_CSS).walkRules((rule) => {
        if (!isInMaskSupports(rule) || !rule.selectors.map(collapse).includes(selector)) return;
        rule.walkDecls((declaration) => {
            declarations.set(declaration.prop, collapse(declaration.value));
        });
    });
    return declarations;
};

// Every declaration in the sheet (outside @keyframes) with its rule's selectors
const allDeclarations = (): { selectors: string[]; property: string; value: string }[] => {
    const found: { selectors: string[]; property: string; value: string }[] = [];
    postcss.parse(CHALKBOARD_CSS).walkRules((rule) => {
        if (rule.parent?.type === "atrule" && (rule.parent as AtRule).name.endsWith("keyframes")) return;
        rule.walkDecls((declaration) => {
            found.push({ selectors: rule.selectors.map(collapse), property: declaration.prop, value: collapse(declaration.value) });
        });
    });
    return found;
};

// Every rule outside @keyframes and @supports, with its collapsed selectors and declarations
const allRules = (): { selectors: string[]; declarations: Map<string, string> }[] => {
    const rules: { selectors: string[]; declarations: Map<string, string> }[] = [];
    postcss.parse(CHALKBOARD_CSS).walkRules((rule) => {
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
const viewBoxOf = (svg: Document): number[] => (svg.documentElement.getAttribute("viewBox") ?? "").split(/\s+/).map(Number);

describe("chalkboard skin", () => {
    describe("chalk grid", () => {
        it("should paint the chalk lines in the board's chalk through the mask, for WebKit as well as the rest", () => {
            const lines = maskSupportsDeclarationsOf(`${GRID}::after`);

            expect(lines.get("-webkit-mask-image")).toBe(GRID_URL);
            expect(lines.get("mask-image")).toBe(GRID_URL);
            expect(lines.get("background-color")).toBe("var(--color-foreground)");
        });

        it("should lay the chalk lines over the cells, above the digits and below the ring, never taking taps", () => {
            const lines = maskSupportsDeclarationsOf(`${GRID}::after`);

            expect(lines.get("inset")).toBe("0");
            expect(lines.get("z-index")).toBe("3");
            expect(lines.get("pointer-events")).toBe("none");
        });

        it("should hide the plain cell lines and the grid's border only where masks are supported", () => {
            const masked = maskSupportsDeclarationsOf(GRID);
            const plain = declarationsOf(CHALKBOARD_CSS, GRID);

            expect(masked.get("--board-line")).toBe("transparent");
            expect(masked.get("--board-box-line")).toBe("transparent");
            expect(masked.get("border-color")).toBe("transparent");
            expect([plain.get("--board-line"), plain.get("--board-box-line"), plain.get("border-color")]).not.toContain("transparent");
        });

        it("should draw nothing over the board where masks are not supported", () => {
            expect(declarationsOf(CHALKBOARD_CSS, `${GRID}::after`).size).toBe(0);
        });

        it("should lay the board and its plain cells bare on the page, without a shadow", () => {
            const board = declarationsOf(CHALKBOARD_CSS, BOARD);

            expect(board.get("background-color")).toBe("transparent");
            expect(board.get("box-shadow")).toBe("none");
            for (const variant of ["default", "clue"]) {
                const cell = declarationsOf(CHALKBOARD_CSS, `${BOARD} [data-variant="${variant}"]`);
                expect(cell.get("background-color"), variant).toBe("transparent");
                expect(cell.get("box-shadow"), variant).toBe("none");
            }
        });

        describe("chalkboard-grid.svg", () => {
            const svg = parseSvg(GRID_SVG);
            const paths = Array.from(svg.getElementsByTagName("path"));

            it("should parse as the canvas's 351 square drawing, with no filter", () => {
                expect(svg.getElementsByTagName("parsererror")).toHaveLength(0);
                expect(viewBoxOf(svg)).toEqual([0, 0, 351, 351]);
                expect(svg.getElementsByTagName("filter")).toHaveLength(0);
            });

            // Eight inner lines each way, two of them box lines, and the frame's four sides
            it("should draw twelve pale cell lines, four box lines and the frame, the box lines and frame heavier", () => {
                const widthOf = (path: Element): number => Number(path.getAttribute("stroke-width"));
                const cellLines = paths.filter(path => path.getAttribute("opacity") !== null);
                const heavyLines = paths.filter(path => path.getAttribute("opacity") === null);

                expect(cellLines).toHaveLength(12);
                expect(heavyLines).toHaveLength(8);
                expect(Math.max(...cellLines.map(widthOf))).toBeLessThan(Math.min(...heavyLines.map(widthOf)));
            });

            it("should carry only alpha: every stroke in currentColor", () => {
                expect(GRID_SVG).not.toMatch(RAW_COLOUR);
                expect(svg.getElementsByTagName("g")[0].getAttribute("stroke")).toBe("currentColor");
            });
        });
    });

    describe("chalk grain", () => {
        it("should name the grain texture in 黑板 and none on the whiteboard", () => {
            expect(declarationsOf(CHALKBOARD_CSS, DARK).get("--chalkboard-grain")).toBe(GRAIN_URL);
            expect(declarationsOf(CHALKBOARD_CSS, SCOPE).get("--chalkboard-grain")).toBe("none");
        });

        it("should grain the chalk lines in 黑板, through both masks at once", () => {
            const lines = maskSupportsDeclarationsOf(`${DARK_GRID}::after`);

            expect(lines.get("-webkit-mask-image")).toBe(`${GRID_URL}, ${GRAIN}`);
            expect(lines.get("mask-image")).toBe(`${GRID_URL}, ${GRAIN}`);
            expect(lines.get("mask-composite")).toBe("intersect");
            expect(lines.get("-webkit-mask-composite")).toBe("source-in");
        });

        it("should grain the digits in 黑板", () => {
            const digits = declarationsOf(CHALKBOARD_CSS, `${DARK_BOARD} [data-variant] > div`);

            expect(digits.get("-webkit-mask-image")).toBe(GRAIN);
            expect(digits.get("mask-image")).toBe(GRAIN);
        });

        it.each([
            ["the selected cell", `${DARK_BOARD}:not([data-hint-mode]) [data-selected]::after`],
            ["a hint's answer cell", `${DARK_BOARD} [data-variant="answer"]::after`],
        ])("should grain the yellow ring around %s in 黑板", (_name, selector) => {
            const ring = maskSupportsDeclarationsOf(selector);

            expect(ring.get("-webkit-mask-image")).toBe(`${RING_URL}, ${GRAIN}`);
            expect(ring.get("mask-image")).toBe(`${RING_URL}, ${GRAIN}`);
            expect(ring.get("mask-composite")).toBe("intersect");
            expect(ring.get("-webkit-mask-composite")).toBe("source-in");
        });

        // 白板 is markers: smooth strokes, no chalk grain anywhere
        it("should lay the grain only in 黑板", () => {
            const grained = allDeclarations().filter(({ property, value }) => !property.startsWith("--")
                && (value.includes("--chalkboard-grain") || value.includes("chalkboard-grain.svg")));

            expect(grained.length).toBeGreaterThan(0);
            for (const { selectors, property } of grained) {
                for (const selector of selectors) {
                    expect(selector.startsWith(DARK), `${selector} → ${property}`).toBe(true);
                }
            }
        });

        describe("chalkboard-grain.svg", () => {
            const svg = parseSvg(GRAIN_SVG);

            it("should parse as a square tile, with no filter", () => {
                const [, , width, height] = viewBoxOf(svg);

                expect(svg.getElementsByTagName("parsererror")).toHaveLength(0);
                expect(width).toBeGreaterThan(0);
                expect(width).toBe(height);
                expect(svg.getElementsByTagName("filter")).toHaveLength(0);
            });

            it("should tile the texture over the masked piece at the drawing's own size", () => {
                const [, , width] = viewBoxOf(svg);
                const digits = declarationsOf(CHALKBOARD_CSS, `${DARK_BOARD} [data-variant] > div`);

                expect(digits.get("mask-size")).toBe(`${width}px ${width}px`);
                expect(digits.get("mask-repeat")).toBe("repeat");
            });

            it("should carry only alpha: every shape in currentColor", () => {
                expect(GRAIN_SVG).not.toMatch(RAW_COLOUR);
                expect(GRAIN_SVG).toContain('fill="currentColor"');
            });
        });
    });

    describe("digits", () => {
        it("should set clues, the player's digits, keys, the timer and notes in Chalk Digits once the face has loaded", () => {
            const fonts = declarationsOf(CHALKBOARD_CSS, FONTS_READY);

            for (const token of ["--font-clue", "--font-entry", "--font-key", "--font-timer", "--font-note"]) {
                expect(fonts.get(token), token).toBe("var(--font-chalkboard-digits)");
            }
        });

        it("should write the player's digits in blue chalk or marker", () => {
            expect(declarationsOf(CHALKBOARD_CSS, `${BOARD} [data-value-kind="entered"] > div`).get("color")).toBe("var(--color-accent)");
        });

        it("should keep a wrong digit in the error colour", () => {
            for (const variant of ["error", "wrong"]) {
                expect(declarationsOf(CHALKBOARD_CSS, `${BOARD} [data-variant="${variant}"][data-value-kind="entered"] > div`).get("color"), variant)
                    .toBe("var(--color-error)");
            }
        });

        it("should write the same digit in the primary", () => {
            expect(declarationsOf(CHALKBOARD_CSS, `${BOARD} [data-variant="same-digit"][data-value-kind] > div`).get("color"))
                .toBe("var(--color-primary)");
        });

        it("should write the selected cell's digit in yellow chalk in 黑板", () => {
            expect(declarationsOf(CHALKBOARD_CSS, `${DARK_BOARD} [data-variant="selected"][data-value-kind] > div`).get("color"))
                .toBe("var(--color-primary)");
        });

        it("should keep digits and notes below the chalk lines", () => {
            expect(declarationsOf(CHALKBOARD_CSS, DIGITS).get("z-index")).toBe("2");
        });
    });

    describe("selection ring", () => {
        it.each([
            ["the selected cell", SELECTED_RING],
            ["a hint's answer cell", ANSWER_RING],
        ])("should ring %s above the chalk lines, never taking taps", (_name, selector) => {
            const ring = declarationsOf(CHALKBOARD_CSS, selector);

            expect(ring.get("content")).toBe('""');
            expect(ring.get("z-index")).toBe("4");
            expect(ring.get("pointer-events")).toBe("none");
        });

        it.each([SELECTED_RING, ANSWER_RING])("should draw the hand-drawn ring in the primary through the mask in %s", (selector) => {
            const ring = maskSupportsDeclarationsOf(selector);

            expect(ring.get("-webkit-mask-image")).toBe(RING_URL);
            expect(ring.get("mask-image")).toBe(RING_URL);
            expect(ring.get("background-color")).toBe("var(--color-primary)");
            expect(ring.get("box-shadow")).toBe("none");
        });

        it.each([SELECTED_RING, ANSWER_RING])("should fall back to a plain round ring in the primary where masks are unsupported in %s", (selector) => {
            const ring = declarationsOf(CHALKBOARD_CSS, selector);

            expect(ring.get("box-shadow")).toContain("var(--color-primary)");
            expect(ring.get("background-color")).toBeUndefined();
        });

        it.each(["selected", "answer"])("should give the %s cell no shared ring and no fill", (variant) => {
            const cell = declarationsOf(CHALKBOARD_CSS, `${BOARD} [data-variant="${variant}"]`);

            expect(cell.get("box-shadow")).toBe("none");
            expect(cell.get("background-color")).toBe("transparent");
        });

        describe("chalkboard-ring.svg", () => {
            const svg = parseSvg(RING_SVG);

            it("should parse as a square drawing, so the ring keeps its shape on the square cell, with no filter", () => {
                const [, , width, height] = viewBoxOf(svg);

                expect(svg.getElementsByTagName("parsererror")).toHaveLength(0);
                expect(width).toBeGreaterThan(0);
                expect(width).toBe(height);
                expect(svg.getElementsByTagName("filter")).toHaveLength(0);
            });

            it("should carry only alpha: one stroke in currentColor", () => {
                expect(RING_SVG).not.toMatch(RAW_COLOUR);
                expect(svg.getElementsByTagName("path")).toHaveLength(1);
                expect(svg.getElementsByTagName("path")[0].getAttribute("stroke")).toBe("currentColor");
            });
        });
    });

    // 黑板's red chalk keeps the hint's scope and pattern washes to a breath, so a chalk outline marks them instead,
    // at the cell's edge, clear of every digit and note
    describe("hint cells in 黑板", () => {
        it("should outline the hint's scope cells in faint chalk", () => {
            const scope = declarationsOf(CHALKBOARD_CSS, `${DARK_BOARD} [data-variant="scope"]`);

            expect(scope.get("box-shadow")).toMatch(/^inset 0 0 0 [\d.]+px color-mix\(in srgb, var\(--color-foreground\) \d+%, transparent\)$/);
        });

        it("should outline the hint's pattern cells in yellow chalk", () => {
            const pattern = declarationsOf(CHALKBOARD_CSS, `${DARK_BOARD} [data-variant="pattern"]`);

            expect(pattern.get("box-shadow")).toMatch(/^inset 0 0 0 [\d.]+px color-mix\(in srgb, var\(--color-primary\) \d+%, transparent\)$/);
        });
    });

    describe("chalkboard pages", () => {
        it("should paint the app's page scroller as the board, lit and shaded from the palette alone", () => {
            const page = declarationsOf(CHALKBOARD_CSS, ROOT_PAGE);

            expect(page.get("background-color")).toBe("var(--color-background)");
            expect(page.get("background-image")?.match(/gradient\(/g)?.length).toBeGreaterThanOrEqual(2);
            expect(page.get("background-image")).not.toMatch(RAW_COLOUR);
            // Its own stacking context, so a layer below content still lies above the board
            expect(page.get("isolation")).toBe("isolate");
        });

        it("should dust 黑板 with two fine layers of chalk specks", () => {
            const page = declarationsOf(CHALKBOARD_CSS, DARK_ROOT_PAGE);

            expect(page.get("background-image")?.match(/radial-gradient\(/g)?.length).toBeGreaterThanOrEqual(2);
            expect(page.get("background-image")).not.toMatch(RAW_COLOUR);
            expect(page.get("background-size")).toContain("7px 9px");
            expect(page.get("background-size")).toContain("11px 5px");
        });

        it("should lay the erased smears over 黑板, fixed to the screen, below every content layer and never taking taps", () => {
            const smears = declarationsOf(CHALKBOARD_CSS, `${DARK_ROOT_PAGE}::before`);

            expect(smears.get("content")).toBe('""');
            expect(smears.get("position")).toBe("fixed");
            expect(smears.get("inset")).toBe("0");
            expect(smears.get("z-index")).toBe("-1");
            expect(smears.get("pointer-events")).toBe("none");
            expect(smears.get("-webkit-mask-image")).toBe(SMEARS_URL);
            expect(smears.get("mask-image")).toBe(SMEARS_URL);
            expect(smears.get("background-color")).toMatch(/^color-mix\(in srgb, var\(--color-smear\) [\d.]+%, transparent\)$/);
        });

        // 白板 is markers on a clean board: no dust and no smears (Review Focus 5)
        it("should leave the whiteboard without dust or smears", () => {
            const page = declarationsOf(CHALKBOARD_CSS, ROOT_PAGE);
            const dusty = allRules().filter(rule => Array.from(rule.declarations.values())
                .some(value => value.includes("chalkboard-smears.svg") || value.includes("--color-smear")));

            expect(page.get("background-size")).toBeUndefined();
            expect(page.get("background-image")).not.toMatch(/\d px|\dpx/);
            expect(declarationsOf(CHALKBOARD_CSS, `${ROOT_PAGE}::before`).size).toBe(0);
            expect(dusty.length).toBeGreaterThan(0);
            for (const { selectors } of dusty) {
                for (const selector of selectors) {
                    expect(selector.startsWith(DARK), selector).toBe(true);
                }
            }
        });

        it("should leave a page nested in the scroller clear, without a second copy of the dust or smears", () => {
            for (const selector of [NESTED_PAGE, DARK_NESTED_PAGE]) {
                expect(declarationsOf(CHALKBOARD_CSS, selector).get("background"), selector).toBe("transparent");
            }
            expect(declarationsOf(CHALKBOARD_CSS, `${DARK_NESTED_PAGE}::before`).get("content")).toBe("none");
            expect(declarationsOf(CHALKBOARD_CSS, `${SCOPE} [data-skin~="page"]`).get("background-color")).toBe("transparent");
        });

        it("should keep a sticky page header clear at rest, so the board runs through it", () => {
            expect(declarationsOf(CHALKBOARD_CSS, `${SCOPE} [data-skin~="page-header"]`).get("background-color")).toBe("transparent");
        });

        describe("chalkboard-smears.svg", () => {
            const svg = parseSvg(SMEARS_SVG);

            it("should parse as a 390×844 drawing stretched to the screen, its softness drawn in without a filter", () => {
                expect(svg.getElementsByTagName("parsererror")).toHaveLength(0);
                expect(svg.documentElement.getAttribute("viewBox")).toBe("0 0 390 844");
                expect(svg.documentElement.getAttribute("preserveAspectRatio")).toBe("none");
                expect(svg.getElementsByTagName("filter")).toHaveLength(0);
            });

            it("should carry only alpha: every stroke in currentColor", () => {
                expect(svg.getElementsByTagName("path").length).toBeGreaterThanOrEqual(7);
                expect(SMEARS_SVG).not.toMatch(RAW_COLOUR);
                expect(svg.getElementsByTagName("g")[0].getAttribute("stroke")).toBe("currentColor");
            });
        });
    });

    describe("Home", () => {
        it("should lay the chalk tray along the bottom of the screen, below every content layer and never taking taps", () => {
            const tray = declarationsOf(CHALKBOARD_CSS, `${LOGO}::after`);

            expect(tray.get("content")).toBe('""');
            expect(tray.get("position")).toBe("fixed");
            expect(tray.get("left")).toBe("0");
            expect(tray.get("right")).toBe("0");
            expect(tray.get("bottom")).toBe("0");
            expect(tray.get("z-index")).toBe("-1");
            expect(tray.get("pointer-events")).toBe("none");
        });

        it("should draw the tray, its lit edge, two sticks and a duster in gradients from the palette", () => {
            const tray = declarationsOf(CHALKBOARD_CSS, `${LOGO}::after`);
            const image = tray.get("background-image") ?? "";

            expect(image.match(/linear-gradient\(/g)?.length).toBeGreaterThanOrEqual(5);
            expect(image).toContain("var(--color-tray)");
            expect(image).toContain("var(--color-tray-edge)");
            expect(image).toContain("var(--chalkboard-stick-first)");
            expect(image).toContain("var(--chalkboard-stick-second)");
            expect(image).not.toMatch(RAW_COLOUR);
        });

        it("should hold the board's chalk and yellow chalk in 黑板's tray, a dark and a blue marker in 白板's", () => {
            const whiteboard = declarationsOf(CHALKBOARD_CSS, LOGO);
            const chalkboard = declarationsOf(CHALKBOARD_CSS, `${DARK} [data-skin~="logo"]`);

            expect(whiteboard.get("--chalkboard-stick-first")).toBe("var(--color-foreground)");
            expect(whiteboard.get("--chalkboard-stick-second")).toBe("var(--color-accent)");
            expect(chalkboard.get("--chalkboard-stick-second")).toBe("var(--color-primary)");
        });

        it("should sketch the logo's 九宮 in chalk outlines, with no block of colour", () => {
            const logo = declarationsOf(CHALKBOARD_CSS, LOGO);
            const squares = declarationsOf(CHALKBOARD_CSS, `${LOGO} > div > div`);

            expect(logo.get("background-color")).toBe("transparent");
            expect(logo.get("box-shadow")).toBe("none");
            expect(squares.get("background-color")).toBe("transparent");
            expect(squares.get("box-shadow")).toMatch(/^inset 0 0 0 [\d.]+px var\(--color-border\)$/);
        });

        it("should underline the title with a yellow chalk swoosh, never taking taps", () => {
            const swoosh = declarationsOf(CHALKBOARD_CSS, `${TITLE}::after`);

            expect(swoosh.get("content")).toBe('""');
            expect(swoosh.get("position")).toBe("absolute");
            expect(swoosh.get("pointer-events")).toBe("none");
            expect(swoosh.get("background-color")).toBe("var(--color-primary)");
            expect(swoosh.get("-webkit-mask-image")).toBe(SWOOSH_URL);
            expect(swoosh.get("mask-image")).toBe(SWOOSH_URL);
        });

        it("should make the new-game button the yellow chalk fill whether or not a game is saved", () => {
            const button = declarationsOf(CHALKBOARD_CSS, `${SCOPE} [data-skin~="button"][data-skin~="new-game"]`);

            expect(button.get("background-color")).toBe("var(--color-primary)");
            expect(button.get("color")).toBe("var(--color-on-primary)");
        });

        describe("chalkboard-swoosh.svg", () => {
            const svg = parseSvg(SWOOSH_SVG);

            it("should parse as the canvas's two strokes, with no filter, in currentColor", () => {
                expect(svg.getElementsByTagName("parsererror")).toHaveLength(0);
                expect(svg.getElementsByTagName("filter")).toHaveLength(0);
                expect(SWOOSH_SVG).not.toMatch(RAW_COLOUR);
                expect(svg.getElementsByTagName("path")[0].getAttribute("stroke")).toBe("currentColor");
            });
        });
    });

    describe("type", () => {
        it("should set every text in WenKai, and the figures in Chalk Digits once the face has loaded", () => {
            expect(declarationsOf(CHALKBOARD_CSS, SCOPE).get("--font-sans")).toBe("var(--font-wenkai)");
            expect(declarationsOf(CHALKBOARD_CSS, FONTS_READY).get("--font-mono")).toBe("var(--font-chalkboard-digits)");
        });

        it.each(["title", "dialog-title", "complete-title"])("should write the %s in bold WenKai", (token) => {
            const title = declarationsOf(CHALKBOARD_CSS, `${SCOPE} [data-skin~="${token}"]`);

            expect(title.get("font-family")).toBe("var(--font-wenkai)");
            expect(title.get("font-weight")).toBe("700");
        });

        it("should set no letter-spacing, font-size or border on any element (only placed decorations size themselves)", () => {
            const offending = allRules().flatMap(rule => rule.selectors
                .filter(selector => !isPseudoElement(selector))
                .flatMap(selector => ["letter-spacing", "font-size", "border"]
                    .filter(property => rule.declarations.has(property))
                    .map(property => `${selector} → ${property}`)));

            expect(offending).toEqual([]);
        });
    });

    describe("chalk outlines", () => {
        it.each(["card", "tile", "key", "continue"])("should draw a %s as a chalk outline with uneven corners", (token) => {
            const surface = declarationsOf(CHALKBOARD_CSS, `${SCOPE} [data-skin~="${token}"]`);

            expect(surface.get("border-radius")).toBe(WOBBLY_CORNERS);
            expect(surface.get("box-shadow")).toMatch(CHALK_OUTLINE);
        });

        it("should give the canvas's uneven corners", () => {
            expect(declarationsOf(CHALKBOARD_CSS, SCOPE).get("--chalkboard-wob")).toBe("9px 14px 10px 16px / 14px 9px 16px 10px");
        });

        it("should outline a secondary button in chalk and keep the main ones a fill", () => {
            const secondary = declarationsOf(CHALKBOARD_CSS, `${SCOPE} [data-skin~="button"]:is(.bg-card, .bg-primary-light, .hint-secondary)`);
            const main = declarationsOf(CHALKBOARD_CSS, `${SCOPE} [data-skin~="button"]:is(.bg-primary, .hint-primary)`);

            expect(secondary.get("background-color")).toBe("transparent");
            expect(secondary.get("box-shadow")).toMatch(CHALK_OUTLINE);
            expect(main.get("background-color")).toBe("var(--color-primary)");
            expect(main.get("color")).toBe("var(--color-on-primary)");
        });

        it("should give dialogs and floating panels the solid card, so the page under them does not show through", () => {
            const floating = declarationsOf(CHALKBOARD_CSS, `${SCOPE} [data-skin~="card"]:is(.shadow-modal, .shadow-popup, .shadow-card-lg)`);

            expect(floating.get("background-color")).toBe("var(--color-card)");
            expect(floating.get("box-shadow")).toContain("var(--color-border)");
        });

        it("should give no pressable piece a background-image of its own, so the press wash is never painted over", () => {
            const offending = allRules().flatMap(rule => rule.selectors
                .filter(selector => !isPseudoElement(selector))
                .filter(selector => PRESSABLE_TOKENS.some(token => selector.includes(`[data-skin~="${token}"]`)))
                .filter(() => rule.declarations.has("background-image") || rule.declarations.has("background")));

            expect(offending).toEqual([]);
        });
    });

    describe("keypad", () => {
        // The canvas's .key.on: a faint wash of the primary, ringed and written in it
        it("should wash the chosen key faintly in the primary, its outline and digit in the primary", () => {
            const chosen = declarationsOf(CHALKBOARD_CSS, CHOSEN_KEY);

            expect(chosen.get("background-color")).toBe("var(--color-primary-light)");
            expect(chosen.get("box-shadow")).toBe("inset 0 0 0 2px var(--color-primary)");
            expect(chosen.get("color")).toBe("var(--color-primary)");
        });

        // The canvas grains a key's digit (.key .kd), never its outline or its fill
        it("should grain only the keys' digits in 黑板, not the key with its outline and fill", () => {
            const digit = declarationsOf(CHALKBOARD_CSS, `${DARK} [data-skin~="key"].font-key > span`);
            const masked = allRules().filter(rule => rule.declarations.has("mask-image")).flatMap(rule => rule.selectors);

            expect(digit.get("-webkit-mask-image")).toBe(GRAIN);
            expect(digit.get("mask-image")).toBe(GRAIN);
            expect(masked.filter(selector => /\[data-skin~="key"\](?:\[[^\]]+\]|:[a-z-]+)*$/.test(selector))).toEqual([]);
        });

        // A mask clips to its element's box, and Caveat Brush's strokes overhang a digit's own box
        it("should give a key's digit room for Caveat Brush's overhang and give it back, so nothing moves", () => {
            const room = declarationsOf(CHALKBOARD_CSS, `${SCOPE} [data-skin~="key"].font-key > span`);

            expect(room.get("padding-inline")).toBe("0.1em");
            expect(room.get("margin-inline")).toBe("-0.1em");
        });

        it("should fade a finished key", () => {
            expect(declarationsOf(CHALKBOARD_CSS, `${SCOPE} [data-skin~="key"]:disabled`).get("opacity")).toBe("0.35");
        });

        it("should draw the remaining-count badge as a page-coloured disc ringed in the primary", () => {
            const badge = declarationsOf(CHALKBOARD_CSS, `${SCOPE} [data-skin~="badge"]`);

            expect(badge.get("background-color")).toBe("var(--color-background)");
            expect(badge.get("color")).toBe("var(--color-primary)");
            expect(badge.get("box-shadow")).toBe("inset 0 0 0 1.5px var(--color-primary)");
        });
    });

    describe("choices", () => {
        it("should ring the chosen segment in the primary instead of filling it", () => {
            const indicator = declarationsOf(CHALKBOARD_CSS, `${SCOPE} [data-skin~="segmented-indicator"]`);

            expect(indicator.get("background-color")).toBe("transparent");
            expect(indicator.get("box-shadow")).toBe("inset 0 0 0 2px var(--color-primary)");
            expect(declarationsOf(CHALKBOARD_CSS, `${SCOPE} [data-skin~="segment"][aria-pressed="true"]`).get("color")).toBe("var(--color-primary)");
        });

        it("should outline a chosen tile in the primary instead of filling it", () => {
            const chosen = declarationsOf(CHALKBOARD_CSS, `${SCOPE} [data-skin~="tile"][aria-pressed="true"]`);

            expect(chosen.get("background-color")).toBe("transparent");
            expect(chosen.get("box-shadow")).toBe("inset 0 0 0 2px var(--color-primary)");
            expect(chosen.get("color")).toBe("var(--color-foreground)");
        });

        it("should ring the difficulty pill in the primary and fill the hint-mode pill", () => {
            const pill = declarationsOf(CHALKBOARD_CSS, `${SCOPE} [data-skin~="pill"]`);
            const hint = declarationsOf(CHALKBOARD_CSS, `${SCOPE} [data-skin~="pill"][data-skin~="hint"]`);

            expect(pill.get("background-color")).toBe("transparent");
            expect(pill.get("box-shadow")).toBe("inset 0 0 0 2px var(--color-primary)");
            expect(hint.get("background-color")).toBe("var(--color-primary)");
            expect(hint.get("color")).toBe("var(--color-on-primary)");
        });

        it("should ring an active control in the primary", () => {
            const active = declarationsOf(CHALKBOARD_CSS, `${SCOPE} [aria-pressed="true"] > [data-skin~="control"]`);

            expect(active.get("background-color")).toBe("transparent");
            expect(active.get("box-shadow")).toBe("inset 0 0 0 2px var(--color-primary)");
            expect(active.get("color")).toBe("var(--color-primary)");
        });
    });

    describe("notes", () => {
        it("should write the selected digit's note in the primary, without the disc", () => {
            const note = declarationsOf(CHALKBOARD_CSS, `${BOARD} [data-note-highlight]`);

            expect(note.get("color")).toBe("var(--color-primary)");
            expect(note.get("background-color")).toBe("transparent");
        });

        it("should ring a hint's emphasised candidate in the primary", () => {
            expect(declarationsOf(CHALKBOARD_CSS, `${BOARD}[data-hint-mode] [data-note-highlight]`).get("box-shadow"))
                .toBe("inset 0 0 0 1.5px var(--color-primary)");
        });
    });

    describe("erase smear", () => {
        const GHOST = `${BOARD} [data-variant].value-leave::before`;
        const DARK_GHOST = `${DARK_BOARD} [data-variant].value-leave::before`;

        const framesOf = (name: string): Map<string, Map<string, string>> => {
            const frames = new Map<string, Map<string, string>>();
            postcss.parse(CHALKBOARD_CSS).walkAtRules("keyframes", (atRule) => {
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
        const opacityOf = (frame: Map<string, string> | undefined): number => Number(frame?.get("opacity"));

        it("should smear the erased digit in the entered digit's face and colour, untouchable", () => {
            const ghost = declarationsOf(CHALKBOARD_CSS, GHOST);
            const entered = declarationsOf(CHALKBOARD_CSS, `${BOARD} [data-value-kind="entered"] > div`);

            expect(ghost.get("content")).toBe("attr(data-leaving-value)");
            expect(ghost.get("pointer-events")).toBe("none");
            expect(ghost.get("font-family")).toBe("var(--font-entry)");
            expect(ghost.get("font-size")).toContain("var(--entry-scale, 1)");
            expect(ghost.get("color")).toBe(entered.get("color"));
            expect(ghost.get("opacity")).toBe("0");
        });

        it("should smear sideways through a faint layer to nothing, without a hold that keeps it visible", () => {
            for (const name of ["chalkboard-smear", "chalkboard-wipe"]) {
                const frames = framesOf(name);
                const transform = frames.get("100%")?.get("transform") ?? "";

                expect(opacityOf(frames.get("0%")), name).toBe(1);
                expect(transform, name).toBe("translateX(-3px) scaleX(1.7) skewX(6deg)");
                expect(opacityOf(frames.get("100%")), name).toBe(0);
                const faint = [...frames.entries()].filter(([selector]) => selector !== "0%" && selector !== "100%");
                expect(faint.some(([, frame]) => opacityOf(frame) > 0 && opacityOf(frame) <= 0.25), name).toBe(true);
            }
        });

        it("should blur the smear in 黑板 and wipe it by a marker, with no blur, in 白板", () => {
            const smear = [...framesOf("chalkboard-smear").values()];
            const wipe = [...framesOf("chalkboard-wipe").values()];

            expect(framesOf("chalkboard-smear").get("100%")?.get("filter")).toBe("blur(3px)");
            expect(smear.some(frame => frame.has("filter"))).toBe(true);
            expect(wipe.some(frame => frame.has("filter"))).toBe(false);
            expect(declarationsOf(CHALKBOARD_CSS, GHOST).get("animation")).toContain("chalkboard-wipe");
            expect(declarationsOf(CHALKBOARD_CSS, DARK_GHOST).get("animation")).toContain("chalkboard-smear");
        });

        it("should grain the smear in 黑板 only", () => {
            expect(declarationsOf(CHALKBOARD_CSS, DARK_GHOST).get("mask-image")).toBe(GRAIN);
            expect(declarationsOf(CHALKBOARD_CSS, GHOST).has("mask-image")).toBe(false);
        });

        it("should end before the cell settles, and stop under reduced motion", () => {
            for (const [selector, name] of [[GHOST, "chalkboard-wipe"], [DARK_GHOST, "chalkboard-smear"]] as const) {
                const timing = animationTimingOf(declarationsOf(CHALKBOARD_CSS, selector).get("animation") ?? "", name);

                expect(timing, name).not.toBeNull();
                expect((timing?.durationMs ?? 0) + (timing?.fixedDelayMs ?? 0), name).toBeLessThanOrEqual(ARRIVAL_SETTLE_MS);
                expect(declarationsOf(CHALKBOARD_CSS, selector).get("animation"), name).not.toContain("forwards");
                expect(reducedMotionDeclarationsOf(CHALKBOARD_CSS, selector).get("animation"), name).toBe("none");
            }
        });
    });
});
