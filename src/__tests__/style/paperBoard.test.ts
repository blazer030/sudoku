import { readFileSync } from "fs";
import postcss, { type Rule } from "postcss";

// Paper's board is drawn on the notebook page: a sheet of the page's paper with its grain, the grid
// in the theme's ink, printed clue squares shaded in graphite and every highlight a translucent wash,
// so the grain (and at night the lamp) shows through. The colours are checked in paletteContrast.

const PAPER_CSS = readFileSync("src/style/styles/paper.css", "utf8");
const BOARD = '[data-style="paper"] [data-skin~="board"]';

const declarationsOf = (selector: string): Map<string, string> => {
    const declarations = new Map<string, string>();
    postcss.parse(PAPER_CSS).walkRules((rule: Rule) => {
        if (rule.parent?.type === "atrule") return;
        if (!rule.selectors.map(item => item.replace(/\s+/g, " ").trim()).includes(selector)) return;
        rule.walkDecls((declaration) => {
            declarations.set(declaration.prop, declaration.value.replace(/\s+/g, " ").trim());
        });
    });
    return declarations;
};

// The variants BoardCell can show, read from its CellVariant union
const CELL_VARIANTS = (() => {
    const source = readFileSync("src/presentation/components/board-cell/BoardCell.vue", "utf8");
    const union = /export type CellVariant = ([^;]+);/.exec(source)?.[1] ?? "";
    return [...union.matchAll(/"([\w-]+)"/g)].map(([, variant]) => variant);
})();

describe("paper board", () => {
    it("should read every cell variant from BoardCell", () => {
        expect(CELL_VARIANTS).toEqual(expect.arrayContaining(["default", "clue", "selected", "same-digit", "peer", "answer"]));
    });

    it("should lay the board on a sheet of the page's paper with its grain, not a card with a shadow", () => {
        const board = declarationsOf(BOARD);

        // Its own page surface under the sheet, so the ruled lines behind the board never show through
        expect(board.get("background-color")).toBe("var(--color-background)");
        expect(board.get("background-image")).toBe(
            "var(--paper-texture), linear-gradient(var(--paper-sheet), var(--paper-sheet)), var(--paper-lamp-fade), var(--paper-lamp), var(--paper-texture)");
        expect(board.get("background-attachment")).toBe("scroll, scroll, scroll, fixed, fixed, fixed, fixed");
        expect(board.get("--tw-shadow")).toBe("0 0 transparent");
        expect(declarationsOf('[data-style="paper"]').get("--paper-sheet")).toMatch(/^color-mix\(in srgb, var\(--color-card\) \d+%, transparent\)$/);
    });

    it("should draw the grid in the theme's ink: thin lines faded, box lines as firmer strokes", () => {
        const paper = declarationsOf('[data-style="paper"]');
        const alphaOf = (value: string | undefined): number =>
            Number(/^color-mix\(in srgb, var\(--color-primary\) (\d+)%, transparent\)$/.exec(value ?? "")?.[1] ?? Number.NaN);

        expect(alphaOf(paper.get("--board-line"))).toBeGreaterThan(0);
        expect(alphaOf(paper.get("--board-box-line"))).toBeGreaterThan(alphaOf(paper.get("--board-line")));
        // The grid's outer frame is drawn with the same pen as the box lines
        expect(declarationsOf(`${BOARD} > div`).get("border-color")).toBe("var(--board-box-line)");
    });

    it("should wash every cell variant translucently, the blank cell showing the sheet itself", () => {
        const cell = declarationsOf(`${BOARD} [data-variant]`);

        expect(cell.get("background-color")).toBe("var(--paper-cell-wash)");
        expect(cell.get("--paper-cell-wash")).toBe("transparent");
        // The wash stops at the cell's lines, so the ink reads the same over every wash
        expect(cell.get("background-clip")).toBe("padding-box");
        for (const variant of CELL_VARIANTS.filter(name => name !== "default")) {
            expect(declarationsOf(`${BOARD} [data-variant="${variant}"]`).get("--paper-cell-wash"), variant).toBe(`var(--paper-wash-${variant})`);
            expect(declarationsOf('[data-style="paper"]').get(`--paper-wash-${variant}`), variant).toMatch(/^color-mix\(in srgb, var\(--color-[\w-]+\) [\d.]+%, transparent\)$/);
        }
    });

    it("should shade the printed clue squares with a pencil hatch over the graphite wash", () => {
        expect(declarationsOf(`${BOARD} [data-variant="clue"]`).get("background-image")).toBe("var(--paper-clue-hatch)");
        expect(declarationsOf('[data-style="paper"]').get("--paper-clue-hatch")).toMatch(/^repeating-linear-gradient\(.*var\(--paper-hatch\)/);
    });

    it("should keep the press ink on a pressed clue square", () => {
        const pressed = declarationsOf(`${BOARD} [data-variant="clue"][data-pressed]`).get("background-image") ?? "";

        expect(pressed).toContain("var(--press-overlay)");
        expect(pressed).toContain("var(--paper-clue-hatch)");
    });

    it("should flash a completed group from and back to the cell's own wash", () => {
        // The shared flash starts and ends on the card colour unless a style says what the cell rests on
        const indexCss = readFileSync("src/style/index.css", "utf8");
        const flash = /@keyframes completion-flash \{([^@]*?)\n\}/.exec(indexCss)?.[1] ?? "";

        expect(flash).toContain("0% { background-color: var(--completion-flash-rest, var(--color-card)); }");
        expect(flash).toContain("100% { background-color: var(--completion-flash-rest, var(--color-card)); }");
        expect(declarationsOf(`${BOARD} [data-variant]`).get("--completion-flash-rest")).toBe("var(--paper-cell-wash)");
    });

    it("should square the board's corners like a ruled sheet", () => {
        expect(declarationsOf(`${BOARD} [data-variant]`).get("border-radius")).toBe("0");
    });
});

describe("paper single-cell outlines", () => {
    // The selection, a hint's or walkthrough's answer cell and a wrong entry each mark one cell;
    // paper circles all of them with the same pen instead of a square ring
    const CIRCLED: Record<string, string> = { selected: "var(--color-primary)", answer: "var(--color-primary)", wrong: "var(--color-error)" };

    it.each(Object.entries(CIRCLED))("should circle the %s cell by hand instead of ringing it", (variant, ink) => {
        const cell = declarationsOf(`[data-style="paper"] [data-variant="${variant}"]`);
        const circle = declarationsOf(`[data-style="paper"] [data-variant="${variant}"]::after`);

        expect(cell.get("--tw-ring-shadow")).toBe("0 0 transparent");
        expect(cell.get("position")).toBe("relative");
        expect(circle.get("mask")).toContain("data:image/svg+xml");
        expect(circle.get("background-color")).toBe(ink);
        // Drawn under the cell's digits and notes, over its wash, so the pen never covers a digit
        expect(cell.get("isolation")).toBe("isolate");
        expect(circle.get("z-index")).toBe("-1");
    });

    it("should leave the answer's candidate uncircled inside the circled answer cell, so the two pens never cross", () => {
        // The candidate keeps the highlighted note's bold primary ink; only its own small circle goes
        expect(declarationsOf('[data-style="paper"] [data-variant="answer"] [data-note-highlight]::after').get("content")).toBe("none");
        // Where the cell's circle runs under the corner candidate, a paper halo keeps the digit apart from the stroke
        expect(declarationsOf('[data-style="paper"] [data-variant="answer"] [data-note-highlight]').get("text-shadow")).toContain("var(--color-card)");
    });

    it.each(Object.keys(CIRCLED))("should mark a %s cell showing candidates with pen brackets at its sides, which clear the note grid", (variant) => {
        // A circle over a 3×3 note grid always crosses some candidates; brackets hugging the cell's
        // sides do not. A cell showing a digit keeps the circle.
        const circle = declarationsOf(`[data-style="paper"] [data-variant="${variant}"]::after`);
        const brackets = declarationsOf(`[data-style="paper"] [data-variant="${variant}"]:has(.font-note)::after`);

        expect(brackets.get("mask")).toContain("data:image/svg+xml");
        expect(brackets.get("mask")).not.toBe(circle.get("mask"));
        expect(brackets.get("-webkit-mask")).toBe(brackets.get("mask"));
        expect(brackets.get("rotate")).toBe("0deg");
    });

    it("should stop drawing every circle under reduced motion", () => {
        const stopped: string[] = [];
        postcss.parse(PAPER_CSS).walkAtRules("media", (atRule) => {
            if (!atRule.params.includes("prefers-reduced-motion: reduce")) return;
            atRule.walkRules((rule) => {
                if (rule.nodes.some(node => node.type === "decl" && node.prop === "animation" && node.value === "none")) {
                    stopped.push(...rule.selectors.map(item => item.replace(/\s+/g, " ").trim()));
                }
            });
        });

        for (const variant of Object.keys(CIRCLED)) {
            expect(stopped).toContain(`[data-style="paper"] [data-variant="${variant}"]::after`);
        }
    });
});
