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

// The scope's own custom properties (the shared frames) substituted in, as the browser would
const resolveScopeProperties = (value: string): string => value.replace(/var\((--pixel-[\w-]+)\)/g, (reference, name: string) => {
    const definition = declarationsOf(PIXEL_CSS, SCOPE).get(name);
    return definition === undefined ? reference : resolveScopeProperties(definition);
});

const shadowLayers = (value: string): ShadowLayer[] => splitTopLevel(resolveScopeProperties(value), /,/).map((layer) => {
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
// The selected cell outside hint mode, whichever variant it shows (an error wins over the selection)
const CURSOR = `${BOARD}:not([data-hint-mode]) [data-selected]`;

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

    describe("page background", () => {
        const ROOT = `${SCOPE} .app-safe-area`;
        const DARK = ':root.dark[data-style="pixel"] .app-safe-area';

        it("should lay a faint LCD grid over the whole screen in 掌機", () => {
            const grid = declarationsOf(PIXEL_CSS, `${ROOT}::before`);

            expect(grid.get("background-image")).toContain("linear-gradient(");
            expect(grid.get("background-image")).toContain("90deg");
            expect(grid.get("background-image")).toContain("color-mix(");
            expect(grid.get("background-size")).toBe("3px 3px");
        });

        it("should lay dots over the whole screen in 紅白機, instead of the grid", () => {
            const dots = declarationsOf(PIXEL_CSS, `${DARK}::before`);

            expect(dots.get("background-image")).toContain("radial-gradient(");
            expect(dots.get("background-size")).toBe("4px 4px");
        });

        it("should scatter blinking stars in the top of 紅白機 only", () => {
            const stars = declarationsOf(PIXEL_CSS, `${DARK}::after`);

            expect(stars.get("background-image")?.match(/radial-gradient\(/g)).toHaveLength(3);
            expect(stars.get("animation")).toMatch(/^pixel-blink [\d.]+s steps\(2, jump-none\) infinite$/);
            expect(declarationsOf(PIXEL_CSS, `${ROOT}::after`).has("animation")).toBe(false);
            expect(declarationsOf(PIXEL_CSS, `${ROOT}::after`).has("background-image")).toBe(false);
        });

        it.each(["::before", "::after"])("should fix %s behind the content, taking no taps", (pseudo) => {
            const rule = declarationsOf(PIXEL_CSS, `${pseudo === "::before" ? ROOT : DARK}${pseudo}`);

            expect(rule.get("position")).toBe("fixed");
            expect(rule.get("z-index")).toBe("-1");
            expect(rule.get("pointer-events")).toBe("none");
        });

        it("should draw it once, on the app root, and let the pages show it", () => {
            expect(declarationsOf(PIXEL_CSS, skin("page")).get("background-color")).toBe("transparent");
            expect(PIXEL_CSS.match(/\.app-safe-area::before \{/g)).toHaveLength(2);
        });

        describe("sticky header", () => {
            const HEADER = skin("page-header");
            const SCROLLED = `${HEADER}[data-scrolled]`;

            it("should be clear at rest, so the texture shows through", () => {
                const header = declarationsOf(PIXEL_CSS, HEADER);

                expect(header.get("background-color")).toBe("transparent");
                expect(header.has("backdrop-filter")).toBe(false);
            });

            it("should frost once scrolled, with no rule underneath", () => {
                const scrolled = declarationsOf(PIXEL_CSS, SCROLLED);

                expect(scrolled.get("background-color")).toMatch(/^color-mix\(in srgb, var\(--color-background\) calc\(\d+% \* var\(--header-scroll, 0\)\), transparent\)$/);
                expect(scrolled.get("backdrop-filter")).toMatch(/^blur\(calc\(\d+px \* var\(--header-scroll, 0\)\)\)$/);
                expect(scrolled.get("-webkit-backdrop-filter")).toBe(scrolled.get("backdrop-filter"));
                expect(scrolled.get("mask-image")).toBe("linear-gradient(to bottom, var(--color-foreground) calc(100% - 12px), transparent)");
                expect(scrolled.get("-webkit-mask-image")).toBe(scrolled.get("mask-image"));
                expect(scrolled.has("background-image")).toBe(false);
                expect(scrolled.has("box-shadow")).toBe(false);
            });
        });

        it("should hold the stars still under reduced motion", () => {
            expect(reducedMotionDeclarationsOf(`${DARK}::after`).get("animation")).toBe("none");
        });
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

    it.each(["key", "control", "button", "tile", "segmented", "segment", "badge", "board"])("should square the corners of %s", (token) => {
        expect(declarationsOf(PIXEL_CSS, skin(token)).get("border-radius")).toBe("0");
    });

    it("should draw a segmented control as separate blocks, only the chosen one solid and framed, with no strip or sliding indicator", () => {
        const strip = declarationsOf(PIXEL_CSS, skin("segmented"));
        const segment = declarationsOf(PIXEL_CSS, skin("segment"));
        const chosen = declarationsOf(PIXEL_CSS, `${skin("segment")}[aria-pressed="true"]`);

        expect(strip.get("--segmented-gap")).toBe("10px");
        expect(strip.get("--segmented-padding")).toBe("0px");
        expect(strip.get("background")).toBe("none");
        expect(strip.get("box-shadow")).toBe("none");
        expect(declarationsOf(PIXEL_CSS, skin("segmented-indicator")).get("visibility")).toBe("hidden");
        expect(segment.get("box-shadow")).toBe("none");
        expect(segment.get("background-color")).toBe("transparent");
        expect(segment.get("color")).toBe("var(--pixel-ink)");
        expect(chosen.get("box-shadow")).toBe("var(--pixel-frame-bars)");
        expect(chosen.get("background-color")).toBe("var(--pixel-ink)");
    });

    it("should draw the continue card's chips as a frame without the tint", () => {
        const chip = declarationsOf(PIXEL_CSS, skin("chip"));
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

    // Home, as on the canvas: New Game is always the dark main button, and a blinking pixel arrow marks
    // the continue card and the chosen difficulty
    it("should draw New Game dark even while a saved game makes it the second choice", () => {
        const newGame = declarationsOf(PIXEL_CSS, skin("new-game"));

        expect(newGame.get("background-color")).toBe("var(--color-primary)");
        expect(newGame.get("color")).toBe("var(--color-on-primary)");
    });

    it("should fill the continue card's arrow solid and blink it in steps", () => {
        const caret = declarationsOf(PIXEL_CSS, skin("caret"));

        // The canvas draws it in the highlight: dark green in 掌機, gold in 紅白機
        expect(caret.get("color")).toBe("var(--color-primary)");
        expect(caret.get("fill")).toBe("currentColor");
        expect(caret.get("stroke")).toBe("none");
        expect(caret.get("animation")).toMatch(/^pixel-blink \d+ms steps\(/);
        expect(reducedMotionDeclarationsOf(skin("caret")).get("animation")).toBe("none");
    });

    it("should put a blinking pixel arrow before a menu's chosen option", () => {
        const arrow = declarationsOf(PIXEL_CSS, `${skin("menu")} [aria-pressed="true"]::before`);

        expect(arrow.get("clip-path")).toBe("polygon(0 0, 100% 50%, 0 100%)");
        expect(arrow.get("background-color")).toBe("currentColor");
        expect(arrow.get("animation")).toMatch(/^pixel-blink \d+ms steps\(/);
        expect(reducedMotionDeclarationsOf(`${skin("menu")} [aria-pressed="true"]::before`).get("animation")).toBe("none");
    });

    it("should snap the board's frame between hint mode and play instead of easing it", () => {
        expect(declarationsOf(PIXEL_CSS, skin("board")).get("transition-duration")).toBe("0ms");
    });

    describe("board cells", () => {
        it("should draw the dither and hatch in the shade the board model counts", () => {
            // PIXEL_BOARD_CASES checks every ink on this shade and on the board: the highlight green in 掌機, the navy card in 紅白機
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
            // Two stripes of the shade in each 4px tile, each a quarter of it: half coverage
            expect(declarationsOf(PIXEL_CSS, cell(variant)).get("--pixel-cell-pattern"))
                .toBe("linear-gradient(45deg, var(--pixel-pattern-shade) 25%, transparent 0 50%, var(--pixel-pattern-shade) 0 75%, transparent 0)");
        });

        it.each(["error", "wrong"])("should frame the %s cell 2px in the foreground ink, so it never reads as a dithered peer", (variant) => {
            expect(declarationsOf(PIXEL_CSS, cell(variant)).get("box-shadow")).toBe("inset 0 0 0 2px var(--color-foreground)");
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

        it("should put the cursor on the selected cell even when an error decides its look", () => {
            // The cursor hangs off data-selected, not the selected variant, and the cell is its anchor
            expect(declarationsOf(PIXEL_CSS, CURSOR).get("position")).toBe("relative");
            expect(declarationsOf(PIXEL_CSS, `${cell("selected")}::before`).size).toBe(0);
        });

        it("should frame the selected cell with four blinking corner brackets", () => {
            const cursor = declarationsOf(PIXEL_CSS, `${CURSOR}::before`);
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
            const cursor = declarationsOf(PIXEL_CSS, `${CURSOR}::before`);

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

        it("should draw hint mode's focus and pattern cells solid in the pattern shade", () => {
            expect(declarationsOf(PIXEL_CSS, cell("focus")).get("--pixel-cell-fill")).toBe("var(--pixel-pattern-shade)");
            expect(declarationsOf(PIXEL_CSS, cell("pattern")).get("--pixel-cell-fill")).toBe("var(--pixel-pattern-shade)");
        });

        // A step's target cell is marked like the game's selected cell: four blinking corners, no fill or frame
        it("should mark a step's answer cell with the blinking corner cursor alone", () => {
            const answer = declarationsOf(PIXEL_CSS, cell("answer"));
            const answerCursor = declarationsOf(PIXEL_CSS, `${cell("answer")}::before`);
            const selectedCursor = declarationsOf(PIXEL_CSS, `${CURSOR}::before`);

            expect(answer.get("--pixel-cell-fill")).toBeUndefined();
            // The shared answer ring gives way to the cursor, as on the selected cell
            expect(answer.get("box-shadow")).toBe("none");
            expect(answer.get("position")).toBe("relative");
            expect(answerCursor.get("background")).toBe(selectedCursor.get("background"));
            expect(answerCursor.get("animation")).toBe(selectedCursor.get("animation"));
            expect(reducedMotionDeclarationsOf(`${cell("answer")}::before`).get("animation")).toBe("none");
        });

        it("should snap cell colours in hint mode instead of fading them", () => {
            expect(declarationsOf(PIXEL_CSS, `${BOARD} [data-variant]`).get("transition-duration")).toBe("0ms");
        });

        it("should hold the cursor and error digit still under reduced motion", () => {
            expect(reducedMotionDeclarationsOf(`${CURSOR}::before`).get("animation")).toBe("none");
            expect(reducedMotionDeclarationsOf(`${cell("error")} > div`).get("animation")).toBe("none");
        });
    });

    describe("digit motion", () => {
        const ARRIVE = `${BOARD} .value-arrive`;
        // The cell whose digit arrives or leaves; the arrival is the digit's class, so the cell finds it with :has()
        const BURST_CELL = `${BOARD} [data-variant]:is(.value-leave, :has(> .value-arrive))`;
        const BURST = `${BURST_CELL}::after`;

        const keyframesOf = (name: string): Map<string, Map<string, string>> => {
            const frames = new Map<string, Map<string, string>>();
            postcss.parse(PIXEL_CSS).walkAtRules("keyframes", (atRule) => {
                if (atRule.params.trim() !== name) return;
                atRule.walkRules((frame) => {
                    const declarations = new Map<string, string>();
                    frame.walkDecls((declaration) => {
                        declarations.set(declaration.prop, declaration.value.replace(/\s+/g, " ").trim());
                    });
                    frames.set(frame.selector, declarations);
                });
            });
            return frames;
        };

        it("should pop a placed digit in four held frames that go past its size and settle", () => {
            // steps() applies to each keyframe interval, so one step per quarter holds each frame
            const name = /^(pixel-[\w-]+) \d+ms steps\(1, end\)$/.exec(declarationsOf(PIXEL_CSS, ARRIVE).get("animation") ?? "")?.[1] ?? "";
            const scales = [...keyframesOf(name)].map(([selector, frame]) => {
                const transform = frame.get("transform") ?? "";
                return [selector, transform === "none" ? 1 : Number(/^scale\(([\d.]+)\)$/.exec(transform)?.[1])] as const;
            });

            expect(scales.map(([selector]) => selector)).toEqual(["0%", "25%", "50%", "75%, 100%"]);
            const [small, over, under, rest] = scales.map(([, scale]) => scale);
            expect(small).toBeLessThan(1);
            expect(over).toBeGreaterThan(1);
            expect(under).toBeLessThan(1);
            expect(rest).toBe(1);
        });

        // Arriving and leaving bursts run different keyframes, so a digit that flips from one to the
        // other before its burst ends starts a fresh burst rather than inheriting the old one's clock
        const ARRIVE_BURST = `${BOARD} [data-variant]:has(> .value-arrive)::after`;
        const LEAVE_BURST = `${BOARD} [data-variant].value-leave::after`;
        const burstNameOf = (selector: string): string => /^(pixel-[\w-]+) /.exec(declarationsOf(PIXEL_CSS, selector).get("animation") ?? "")?.[1] ?? "";

        it("should burst eight pixels out of the cell as its digit arrives or leaves, in four steps", () => {
            const burst = declarationsOf(PIXEL_CSS, BURST);

            // The burst hangs off the cell, so the pop's scaling never shrinks it
            expect(declarationsOf(PIXEL_CSS, BURST_CELL).get("position")).toBe("relative");
            expect(burst.get("content")).toBe('""');
            expect(burst.get("width")).toBe("4px");
            expect(burst.get("height")).toBe("4px");
            for (const selector of [ARRIVE_BURST, LEAVE_BURST]) {
                const pixels = shadowLayers(keyframesOf(burstNameOf(selector)).get("to")?.get("box-shadow") ?? "");

                expect(declarationsOf(PIXEL_CSS, selector).get("animation"), selector).toMatch(/^pixel-[\w-]+ \d+ms steps\(4, jump-start\)$/);
                expect(pixels, selector).toHaveLength(8);
                expect(pixels.filter(pixel => pixel.inset || pixel.blur !== 0 || pixel.spread !== 0), selector).toEqual([]);
                // Four straight out and four on the diagonals
                expect(pixels.filter(pixel => (pixel.offsetX === 0) !== (pixel.offsetY === 0)), selector).toHaveLength(4);
                expect(pixels.filter(pixel => pixel.offsetX !== 0 && Math.abs(pixel.offsetX) === Math.abs(pixel.offsetY)), selector).toHaveLength(4);
            }
        });

        it("should restart the burst when a digit flips between arriving and leaving", () => {
            expect(burstNameOf(ARRIVE_BURST)).not.toBe("");
            expect(burstNameOf(LEAVE_BURST)).not.toBe("");
            expect(burstNameOf(ARRIVE_BURST)).not.toBe(burstNameOf(LEAVE_BURST));
        });

        it("should colour the arriving burst from the palette and the leaving one in the leaving colour", () => {
            const scope = declarationsOf(PIXEL_CSS, SCOPE);
            const consoleMode = declarationsOf(PIXEL_CSS, ':root.dark[data-style="pixel"]');
            const coloursOf = (selector: string): string[] => [...new Set(
                [...(keyframesOf(burstNameOf(selector)).get("to")?.get("box-shadow") ?? "").matchAll(/var\((--[\w-]+)\)/g)].map(([, name]) => name),
            )].sort();

            for (const index of [1, 2, 3, 4]) {
                expect(scope.get(`--pixel-burst-${index}`), `burst ${index}`).toMatch(/^var\(--color-[\w-]+\)$/);
                expect(consoleMode.get(`--pixel-burst-${index}`), `console burst ${index}`).toMatch(/^var\(--color-[\w-]+\)$/);
            }
            expect(coloursOf(ARRIVE_BURST)).toEqual(["--pixel-burst-1", "--pixel-burst-2", "--pixel-burst-3", "--pixel-burst-4"]);
            expect(coloursOf(LEAVE_BURST)).toEqual(["--pixel-burst-leave"]);
            // The mid green: the light green on the page is a ghost (1.2:1), and the burst is decoration
            expect(scope.get("--pixel-burst-leave")).toBe("var(--color-border)");
            expect(consoleMode.get("--pixel-burst-leave")).toBe("var(--color-foreground-secondary)");
        });

        it("should burst over the grid lines", () => {
            expect(Number(declarationsOf(PIXEL_CSS, BURST).get("z-index"))).toBeGreaterThan(Number(declarationsOf(PIXEL_CSS, `${BOARD} > div::before`).get("z-index")));
        });

        // The selected cell is inverted, so a flash or glow behind it would sit under its page-coloured
        // digit; it is marked by the cursor and the pop instead. The shared glow is defined after the flash
        // so it wins on the answer cell; the pixel flash must not outweigh it.
        const FLASH = `${BOARD} .animate-completion-flash:not(.animate-hint-reveal-glow, [data-selected])`;
        const GLOW = `${BOARD} .animate-hint-reveal-glow:not([data-selected])`;

        it("should flash a completed group in steps, leaving the hint's answer to its own glow", () => {
            const lit = keyframesOf("pixel-completion-flash").get("50%");

            expect(declarationsOf(PIXEL_CSS, FLASH).get("animation")).toBe("pixel-completion-flash var(--group-effect-duration, 500ms) steps(2, jump-none) var(--group-delay, 0ms)");
            expect(lit?.get("background-color")).toBe("var(--pixel-flash-fill)");
            expect(lit?.get("color")).toBe("var(--pixel-flash-ink)");
            // The flash's fill is solid: a peer's dither would otherwise be laid over it
            expect(lit?.get("background-image")).toBe("none");
        });

        it("should invert a flashing cell in 掌機 and light it in the same-digit blue in 紅白機, as the board model counts", () => {
            const handheld = declarationsOf(PIXEL_CSS, SCOPE);
            const consoleMode = declarationsOf(PIXEL_CSS, ':root.dark[data-style="pixel"]');

            // PIXEL_FLASH: the light green's flash (1.2:1 on the page) was all but invisible
            expect(handheld.get("--pixel-flash-fill")).toBe("var(--color-foreground)");
            expect(handheld.get("--pixel-flash-ink")).toBe("var(--color-background)");
            expect(consoleMode.get("--pixel-flash-fill")).toBe("var(--color-highlight)");
            expect(consoleMode.get("--pixel-flash-ink")).toBe("var(--color-foreground)");
        });

        it("should print a flashing cell's digits in the flash's ink, the foreground between flashes", () => {
            // The digits and their underline follow the fill; the entry blue would not read on it
            const frames = keyframesOf("pixel-completion-flash");
            const resting = frames.get("0%, 100%");
            const lit = frames.get("50%");

            for (const ink of ["color", "--pixel-clue-ink", "--pixel-entry-ink"]) {
                expect(resting?.get(ink)).toBe("var(--color-foreground)");
                expect(lit?.get(ink)).toBe("var(--pixel-flash-ink)");
            }
        });

        it("should keep every colour of the flash in its keyframes, so a cell keeps its own look before and after its flash", () => {
            // A cell carries the flash class for the whole group effect, from before the ripple reaches it
            // to after its own flash: anything set on the class itself would show all that time
            const onTheClass: string[] = [];
            postcss.parse(PIXEL_CSS).walkRules((rule: Rule) => {
                if (isInside(rule, atRule => atRule.name === "media" || atRule.name === "keyframes")) return;
                if (!rule.selector.includes("animate-completion-flash")) return;
                rule.walkDecls((declaration) => {
                    if (declaration.prop !== "animation") onTheClass.push(`${rule.selector} { ${declaration.prop} }`);
                });
            });

            expect(onTheClass).toEqual([]);
        });

        it("should leave the selected cell's colours alone during a completion flash or a hint's glow", () => {
            expect(declarationsOf(PIXEL_CSS, `${BOARD} .animate-completion-flash[data-selected]`).get("animation")).toBe("none");
            expect(declarationsOf(PIXEL_CSS, `${BOARD} .animate-hint-reveal-glow[data-selected]`).get("animation")).toBe("none");
        });

        it("should print a glowing cell's digits in the foreground ink, as the board model counts", () => {
            const glowing = declarationsOf(PIXEL_CSS, GLOW);

            expect(glowing.get("--pixel-clue-ink")).toBe("var(--color-foreground)");
            expect(glowing.get("--pixel-entry-ink")).toBe("var(--color-foreground)");
        });

        it("should mark a completed group with a still fill under reduced motion, as other styles keep their colour flash", () => {
            const still = reducedMotionDeclarationsOf(FLASH);

            expect(still.get("animation")).toBe("none");
            // The flash's own lit look, for as long as the cell is in the effect
            expect(still.get("background-color")).toBe("var(--pixel-flash-fill)");
            expect(still.get("color")).toBe("var(--pixel-flash-ink)");
            expect(still.get("--pixel-entry-ink")).toBe("var(--pixel-flash-ink)");
            expect(still.get("background-image")).toBe("none");
        });

        it("should step a hint's reveal: the answer pops like a placed digit and its glow snaps off", () => {
            const glow = declarationsOf(PIXEL_CSS, GLOW).get("animation") ?? "";
            const lit = keyframesOf("pixel-hint-glow").get("0%, 45%");

            expect(declarationsOf(PIXEL_CSS, `${BOARD} .animate-hint-reveal-pop`).get("animation")).toBe(declarationsOf(PIXEL_CSS, ARRIVE).get("animation"));
            expect(glow).toMatch(/^pixel-hint-glow (\d+)ms steps\(2, jump-none\)$/);
            // The shared glow's own length, inside the 1100ms the revealed cell keeps its class
            expect(Number(/(\d+)ms/.exec(glow)?.[1])).toBe(1000);
            expect(lit?.get("background-color")).toBe("var(--color-primary-light)");
            expect(lit?.get("background-image")).toBe("none");
            expect(lit?.get("box-shadow")).toBe("inset 0 0 0 2px var(--color-primary)");
        });

        it("should hold a hint's reveal still under reduced motion, its glow a plain fill for as long as it shows", () => {
            const glow = reducedMotionDeclarationsOf(GLOW);

            expect(reducedMotionDeclarationsOf(`${BOARD} .animate-hint-reveal-pop`).get("animation")).toBe("none");
            expect(glow.get("animation")).toBe("none");
            expect(glow.get("background-color")).toBe("var(--color-primary-light)");
            expect(glow.get("background-image")).toBe("none");
            expect(glow.get("box-shadow")).toBe("inset 0 0 0 2px var(--color-primary)");
        });

        it("should hold every digit still under reduced motion", () => {
            expect(reducedMotionDeclarationsOf(ARRIVE).get("animation")).toBe("none");
            expect(reducedMotionDeclarationsOf(ARRIVE_BURST).get("animation")).toBe("none");
            expect(reducedMotionDeclarationsOf(LEAVE_BURST).get("animation")).toBe("none");
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
