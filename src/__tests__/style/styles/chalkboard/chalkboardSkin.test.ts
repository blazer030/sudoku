import { readFileSync } from "fs";
import postcss, { type AtRule, type Rule } from "postcss";
import { declarationsOf } from "../../styleSheetRules";

const CHALKBOARD_CSS = readFileSync("src/style/styles/chalkboard/skin.css", "utf8");
const GRID_SVG = readFileSync("src/style/styles/chalkboard/chalkboard-grid.svg", "utf8");
const RING_SVG = readFileSync("src/style/styles/chalkboard/chalkboard-ring.svg", "utf8");
const GRAIN_SVG = readFileSync("src/style/styles/chalkboard/chalkboard-grain.svg", "utf8");

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
const GRAIN = "var(--chalkboard-grain)";
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
});
