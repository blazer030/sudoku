import { readFileSync } from "fs";
import postcss, { type AtRule, type Declaration, type Node, type Rule } from "postcss";
import { declarationsOf } from "../../styleSheetRules";

const PIXEL_CSS = readFileSync("src/style/styles/pixel/skin.css", "utf8");

const SCOPE = '[data-style="pixel"]';
const FONTS_READY = '[data-style="pixel"][data-pixel-fonts="ready"]';

// Splits on a separator outside parentheses, so var(), calc() and colour functions stay whole
const splitTopLevel = (value: string, separator: RegExp): string[] => {
    const parts: string[] = [];
    let depth = 0;
    let current = "";
    for (const character of value) {
        if (character === "(") depth += 1;
        if (character === ")") depth -= 1;
        if (depth === 0 && separator.test(character)) {
            parts.push(current);
            current = "";
        } else {
            current += character;
        }
    }
    parts.push(current);
    return parts.map(part => part.trim()).filter(part => part !== "");
};

interface ShadowLayer { inset: boolean; offsetX: number; offsetY: number; blur: number; spread: number }

const shadowLayers = (value: string): ShadowLayer[] => splitTopLevel(value, /,/).map((layer) => {
    const parts = splitTopLevel(layer, /\s/);
    const lengths = parts.filter(part => /^-?\d*\.?\d+(?:px|em|rem)?$/.test(part)).map(part => Number.parseFloat(part));
    return { inset: parts.includes("inset"), offsetX: lengths[0] ?? 0, offsetY: lengths[1] ?? 0, blur: lengths[2] ?? 0, spread: lengths[3] ?? 0 };
});

const isInside = (node: Node, test: (atRule: AtRule) => boolean): boolean => {
    let current = node.parent;
    while (current !== undefined) {
        if (current.type === "atrule" && test(current as AtRule)) return true;
        current = current.parent;
    }
    return false;
};

const allDeclarations = (property: RegExp): Declaration[] => {
    const declarations: Declaration[] = [];
    postcss.parse(PIXEL_CSS).walkDecls(property, (declaration) => {
        declarations.push(declaration);
    });
    return declarations;
};

const skin = (token: string): string => `${SCOPE} [data-skin~="${token}"]`;

const BOARD = skin("board");
const cell = (variant: string): string => `${BOARD} [data-variant="${variant}"]`;

// The declarations of the rules inside the reduced-motion block that list `selector`
const reducedMotionDeclarationsOf = (selector: string): Map<string, string> => {
    const declarations = new Map<string, string>();
    postcss.parse(PIXEL_CSS).walkRules((rule: Rule) => {
        if (!isInside(rule, atRule => atRule.name === "media" && atRule.params.includes("prefers-reduced-motion: reduce"))) return;
        if (!rule.selectors.map(item => item.replace(/\s+/g, " ").trim()).includes(selector)) return;
        rule.walkDecls((declaration) => {
            declarations.set(declaration.prop, declaration.value.replace(/\s+/g, " ").trim());
        });
    });
    return declarations;
};

describe("pixel skin", () => {
    it("should set every text in pixel type once its fonts have loaded", () => {
        const fonts = declarationsOf(PIXEL_CSS, FONTS_READY);

        expect(fonts.get("--font-sans")).toBe("var(--font-pixel)");
        expect(fonts.get("--font-mono")).toBe("var(--font-pixel)");
        for (const token of ["--font-clue", "--font-entry", "--font-key", "--font-timer"]) {
            expect(fonts.get(token), token).toBe("var(--font-pixel-digits)");
        }
        expect(fonts.get("--font-note")).toBe("var(--font-pixel-note)");
    });

    it("should repoint no font outside the fonts-ready gate", () => {
        // Every selector of the rule must sit under the gate, not just the first one in a list
        const ungated = allDeclarations(/^--font-/).filter(declaration =>
            declaration.parent?.type !== "rule"
            || (declaration.parent as Rule).selectors.some(selector => !selector.trim().startsWith(FONTS_READY)));

        expect(ungated.map(declaration => declaration.prop)).toEqual([]);
    });

    it("should never thicken a pixel face with synthetic bold", () => {
        expect(declarationsOf(PIXEL_CSS, SCOPE).get("font-synthesis")).toBe("none");
    });

    it("should draw the grid in solid palette colours", () => {
        const scope = declarationsOf(PIXEL_CSS, SCOPE);

        for (const token of ["--board-line", "--board-box-line"]) {
            expect(scope.get(token), token).toMatch(/^var\(--color-[a-z-]+\)$/);
        }
    });

    it("should give a key a hard drop shadow", () => {
        const layers = shadowLayers(declarationsOf(PIXEL_CSS, skin("key")).get("box-shadow") ?? "");

        expect(layers.length).toBeGreaterThan(0);
        expect(layers.filter(layer => layer.blur !== 0)).toEqual([]);
        expect(layers.some(layer => !layer.inset && layer.offsetX > 0 && layer.offsetY > 0)).toBe(true);
    });

    it("should drop a pressed key into its shadow", () => {
        const pressed = declarationsOf(PIXEL_CSS, `${skin("key")}[data-press-motion][data-pressed]`);
        const layers = shadowLayers(pressed.get("box-shadow") ?? "");

        expect(pressed.get("transform")).toBe("translate(4px, 4px)");
        expect(layers.some(layer => layer.offsetX > 0 && layer.offsetY > 0)).toBe(false);
    });

    it.each(["key", "control", "button", "tile", "segmented", "badge", "board"])("should square the corners of %s", (token) => {
        expect(declarationsOf(PIXEL_CSS, skin(token)).get("border-radius")).toBe("0");
    });

    it("should draw the continue card's chips as a frame without the tint", () => {
        const chip = declarationsOf(PIXEL_CSS, `${skin("continue")} > span + span > span`);
        const layers = shadowLayers(chip.get("box-shadow") ?? "");

        expect(chip.get("background-color")).toBe("transparent");
        expect(layers).toEqual([{ inset: true, offsetX: 0, offsetY: 0, blur: 0, spread: 2 }]);
    });

    it("should keep a tile that is on framed, since a style card shows its choice only by its border", () => {
        const borderColor = declarationsOf(PIXEL_CSS, `${skin("tile")}[aria-pressed="true"]`).get("border-color");

        expect(borderColor).toBeDefined();
        expect(borderColor).not.toBe("transparent");
    });

    it("should leave a game control's label clear, with a frame but no drop shadow", () => {
        const layers = shadowLayers(declarationsOf(PIXEL_CSS, skin("control")).get("box-shadow") ?? "");

        expect(layers.length).toBeGreaterThan(0);
        expect(layers.filter(layer => layer.offsetX > 0 && layer.offsetY > 0)).toEqual([]);
    });

    it("should clear the shared soft shadows and glows", () => {
        expect(declarationsOf(PIXEL_CSS, `${SCOPE} *`).get("--tw-shadow-color")).toBe("transparent");
    });

    it.each(["card", "pill"])("should frame a %s in hard square pixels", (token) => {
        const declarations = declarationsOf(PIXEL_CSS, skin(token));
        const layers = shadowLayers(declarations.get("box-shadow") ?? "");

        expect(declarations.get("border-radius")).toBe("0");
        // A notched frame: four bars offset to each side, none blurred
        expect(layers.filter(layer => layer.blur !== 0)).toEqual([]);
        expect(layers.filter(layer => !layer.inset && (layer.offsetX === 0) !== (layer.offsetY === 0))).toHaveLength(4);
    });

    it("should square every round shape", () => {
        expect(declarationsOf(PIXEL_CSS, `${SCOPE} .rounded-full`).get("border-radius")).toBe("0");
    });

    it("should draw hint mode on the board as a doubled frame that blinks in, instead of the shared ring", () => {
        const board = declarationsOf(PIXEL_CSS, skin("board"));
        const hint = declarationsOf(PIXEL_CSS, `${skin("board")}[data-hint-mode]`);
        const layers = shadowLayers(hint.get("--tw-shadow") ?? "");

        // ring-primary/50 is the frame's own ink in 掌機, so the shared ring is hidden and the frame carries hint mode
        expect(board.get("--tw-ring-color")).toBe("transparent");
        expect(layers.filter(layer => layer.blur !== 0)).toEqual([]);
        expect(layers.some(layer => !layer.inset && layer.offsetX === 0 && layer.offsetY === 0 && layer.spread > 4)).toBe(true);
        expect(hint.get("animation")).toMatch(/^pixel-[\w-]+ \d+ms steps\(/);
    });

    it("should snap the board's frame between hint mode and play instead of easing it", () => {
        expect(declarationsOf(PIXEL_CSS, skin("board")).get("transition-duration")).toBe("0ms");
    });

    describe("board cells", () => {
        it("should draw the dither and hatch in the shade the board model counts", () => {
            // PIXEL_BOARD_CASES: the highlight green in 掌機, the navy card in 紅白機, at half coverage
            expect(declarationsOf(PIXEL_CSS, SCOPE).get("--pixel-pattern-shade")).toBe("var(--color-highlight)");
            expect(declarationsOf(PIXEL_CSS, ':root.dark[data-style="pixel"]').get("--pixel-pattern-shade")).toBe("var(--color-card)");
        });

        it("should lay every cell on the board's own colour, with its pattern in 4px tiles", () => {
            const base = declarationsOf(PIXEL_CSS, `${BOARD} [data-variant]`);

            expect(base.get("--pixel-cell-fill")).toBe("var(--color-background)");
            expect(base.get("background-color")).toBe("var(--pixel-cell-fill)");
            expect(base.get("background-image")).toBe("var(--pixel-cell-pattern)");
            expect(base.get("background-size")).toBe("4px 4px");
        });

        it("should keep a pressed cell's pattern under the press overlay", () => {
            const pressed = declarationsOf(PIXEL_CSS, `${BOARD} [data-variant][data-pressed]`);

            expect(pressed.get("background-image")).toMatch(/^linear-gradient\(var\(--press-overlay\), var\(--press-overlay\)\), var\(--pixel-cell-pattern\)$/);
            expect(pressed.get("background-size")).toBe("auto, 4px 4px");
        });

        it.each(["scope", "peer"])("should dither the %s cell in a 2px checker", (variant) => {
            expect(declarationsOf(PIXEL_CSS, cell(variant)).get("--pixel-cell-pattern"))
                .toBe("repeating-conic-gradient(var(--pixel-pattern-shade) 0 25%, transparent 0 50%)");
        });

        it.each(["error", "wrong"])("should hatch the %s cell diagonally", (variant) => {
            expect(declarationsOf(PIXEL_CSS, cell(variant)).get("--pixel-cell-pattern")).toMatch(/^linear-gradient\(45deg, var\(--pixel-pattern-shade\) 25%/);
        });

        it("should blink an error cell's digit twice, in steps", () => {
            expect(declarationsOf(PIXEL_CSS, `${cell("error")} > div`).get("animation")).toMatch(/^pixel-[\w-]+ \d+ms steps\(2, jump-none\) 2$/);
        });

        it("should fill a same-digit cell solid, its digits in the foreground ink", () => {
            const sameDigit = declarationsOf(PIXEL_CSS, cell("same-digit"));

            expect(sameDigit.get("--pixel-cell-fill")).toBe("var(--color-highlight)");
            expect(sameDigit.get("--pixel-cell-pattern")).toBeUndefined();
            // The entry blue reads only 2.61 on 紅白機's same-digit blue
            expect(sameDigit.get("--pixel-clue-ink")).toBe("var(--color-foreground)");
            expect(sameDigit.get("--pixel-entry-ink")).toBe("var(--color-foreground)");
        });

        it("should print clues in the foreground ink and the player's digits in the accent", () => {
            const base = declarationsOf(PIXEL_CSS, `${BOARD} [data-variant]`);

            expect(base.get("--pixel-clue-ink")).toBe("var(--color-foreground)");
            expect(base.get("--pixel-entry-ink")).toBe("var(--color-accent)");
            expect(declarationsOf(PIXEL_CSS, `${BOARD} [data-value-kind="given"] > div`).get("color")).toBe("var(--pixel-clue-ink)");
            expect(declarationsOf(PIXEL_CSS, `${BOARD} [data-value-kind="entered"] > div`).get("color")).toBe("var(--pixel-entry-ink)");
            expect(declarationsOf(PIXEL_CSS, cell("error")).get("--pixel-entry-ink")).toBe("var(--color-error)");
        });

        it("should underline a player's digit 2px in its own colour, which a clue never has", () => {
            const underline = declarationsOf(PIXEL_CSS, `${BOARD} [data-value-kind="entered"] > div::after`);

            expect(underline.get("content")).toBe('""');
            expect(underline.get("height")).toBe("2px");
            expect(underline.get("background-color")).toBe("currentColor");
            expect(declarationsOf(PIXEL_CSS, `${BOARD} [data-value-kind="given"] > div::after`).size).toBe(0);
        });

        it("should invert the selected cell", () => {
            const selected = declarationsOf(PIXEL_CSS, cell("selected"));

            expect(selected.get("--pixel-cell-fill")).toBe("var(--color-foreground)");
            expect(selected.get("--pixel-clue-ink")).toBe("var(--color-background)");
            expect(selected.get("--pixel-entry-ink")).toBe("var(--color-background)");
            expect(selected.get("box-shadow")).toBe("none");
            expect(declarationsOf(PIXEL_CSS, `${cell("selected")} *`).get("color")).toBe("var(--color-background)");
        });

        it("should frame the selected cell with four blinking corner brackets", () => {
            const cursor = declarationsOf(PIXEL_CSS, `${cell("selected")}::before`);
            const brackets = splitTopLevel(cursor.get("background") ?? "", /,/);

            expect(cursor.get("content")).toBe('""');
            // Each corner is two bars, one across and one down
            expect(brackets).toHaveLength(8);
            for (const corner of ["top left", "top right", "bottom left", "bottom right"]) {
                expect(brackets.filter(bracket => bracket.includes(` ${corner} /`)), corner).toHaveLength(2);
            }
            expect(cursor.get("animation")).toMatch(/^pixel-[\w-]+ \d+ms steps\(2, jump-none\) infinite$/);
        });

        it("should keep the grid lines over the cells, and the cursor over the lines", () => {
            const lines = declarationsOf(PIXEL_CSS, `${BOARD} > div::before`);
            const cursor = declarationsOf(PIXEL_CSS, `${cell("selected")}::before`);

            // The selected cell is positioned for its cursor, so it would otherwise paint over the overlay
            expect(declarationsOf(PIXEL_CSS, `${BOARD} > div`).get("isolation")).toBe("isolate");
            expect(Number(lines.get("z-index"))).toBeGreaterThan(0);
            expect(Number(cursor.get("z-index"))).toBeGreaterThan(Number(lines.get("z-index")));
            expect(Number(declarationsOf(PIXEL_CSS, `${BOARD} > div > svg`).get("z-index"))).toBeGreaterThan(Number(lines.get("z-index")));
        });

        it("should keep a highlighted note readable inside the inverted selection", () => {
            const note = declarationsOf(PIXEL_CSS, `${cell("selected")} [data-note-highlight]`);

            expect(note.get("background-color")).toBe("var(--color-background)");
            expect(note.get("color")).toBe("var(--color-foreground)");
        });

        it("should draw hint mode's pattern and answer cells solid in the pattern shade, the answer framed", () => {
            expect(declarationsOf(PIXEL_CSS, cell("pattern")).get("--pixel-cell-fill")).toBe("var(--pixel-pattern-shade)");
            expect(declarationsOf(PIXEL_CSS, cell("answer")).get("--pixel-cell-fill")).toBe("var(--pixel-pattern-shade)");
            expect(declarationsOf(PIXEL_CSS, cell("answer")).get("box-shadow")).toBe("inset 0 0 0 3px var(--color-primary)");
            expect(declarationsOf(PIXEL_CSS, cell("wrong")).get("box-shadow")).toBe("inset 0 0 0 3px var(--color-error)");
        });

        it("should snap cell colours in hint mode instead of fading them", () => {
            expect(declarationsOf(PIXEL_CSS, `${BOARD} [data-variant]`).get("transition-duration")).toBe("0ms");
        });

        it("should hold the cursor and error digit still under reduced motion", () => {
            expect(reducedMotionDeclarationsOf(`${cell("selected")}::before`).get("animation")).toBe("none");
            expect(reducedMotionDeclarationsOf(`${cell("error")} > div`).get("animation")).toBe("none");
        });
    });

    it("should frame a plain button over a component's own scoped look (the hint panel's)", () => {
        const plain = declarationsOf(PIXEL_CSS, `${skin("button")}:not([data-skin~="continue"], [data-skin~="new-game"])`);
        const layers = shadowLayers(plain.get("box-shadow") ?? "");

        expect(plain.get("border-radius")).toBe("0");
        expect(plain.get("transition-duration")).toBe("0ms");
        expect(layers.filter(layer => layer.blur !== 0)).toEqual([]);
        expect(layers.filter(layer => !layer.inset && (layer.offsetX === 0) !== (layer.offsetY === 0))).toHaveLength(4);
    });

    it("should move only in steps", () => {
        const moving = allDeclarations(/^(?:animation|animation-timing-function|transition|transition-timing-function)$/)
            .filter(declaration => !isInside(declaration, atRule => atRule.name === "media"))
            .filter(declaration => declaration.value.trim() !== "none");

        expect(moving.length).toBeGreaterThan(0);
        expect(moving.filter(declaration => !declaration.value.includes("steps(")).map(declaration => declaration.toString())).toEqual([]);
    });
});
