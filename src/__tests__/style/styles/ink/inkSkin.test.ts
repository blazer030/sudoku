import { readFileSync } from "fs";
import postcss, { type AtRule } from "postcss";
import { declarationsOf } from "../../styleSheetRules";

const INK_CSS = readFileSync("src/style/styles/ink/skin.css", "utf8");
const BRUSH_GRID_SVG = readFileSync("src/style/styles/ink/brush-grid.svg", "utf8");

const SCOPE = '[data-style="ink"]';
const FONTS_READY = '[data-style="ink"][data-ink-fonts="ready"]';
const BOARD = `${SCOPE} [data-skin~="board"]`;
const GRID = `${SCOPE} [data-skin~="board-grid"]`;
const RING = "inset 0 0 0 1px var(--color-primary-ink)";
// Through the alias: a path relative to skin.css is lost once the sheet is inlined into index.css and
// minified, so a production build would look for the file beside index.css
const BRUSH_GRID_URL = 'url("@/style/styles/ink/brush-grid.svg")';

const collapse = (text: string): string => text.replace(/\s+/g, " ").trim();

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

        it("should lay the brush lines over the grid's border box, above the digits, never taking taps", () => {
            const lines = maskSupportsDeclarationsOf(`${GRID}::after`);

            expect(lines.get("inset")).toBe("-3px");
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
