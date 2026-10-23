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

        it("should draw hint mode's focus, pattern and answer cells solid in the pattern shade, the answer framed", () => {
            expect(declarationsOf(PIXEL_CSS, cell("focus")).get("--pixel-cell-fill")).toBe("var(--pixel-pattern-shade)");
            expect(declarationsOf(PIXEL_CSS, cell("pattern")).get("--pixel-cell-fill")).toBe("var(--pixel-pattern-shade)");
            expect(declarationsOf(PIXEL_CSS, cell("answer")).get("--pixel-cell-fill")).toBe("var(--pixel-pattern-shade)");
            expect(declarationsOf(PIXEL_CSS, cell("answer")).get("box-shadow")).toBe("inset 0 0 0 3px var(--color-primary)");
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
            expect(declarationsOf(PIXEL_CSS, FLASH).get("animation")).toMatch(/^pixel-completion-flash \d+ms steps\(2, jump-none\)$/);
            // The flash's fill is solid: a peer's dither would otherwise be laid over it
            expect(keyframesOf("pixel-completion-flash").get("50%")?.get("background-image")).toBe("none");
        });

        it("should leave the selected cell's colours alone during a completion flash or a hint's glow", () => {
            expect(declarationsOf(PIXEL_CSS, `${BOARD} .animate-completion-flash[data-selected]`).get("animation")).toBe("none");
            expect(declarationsOf(PIXEL_CSS, `${BOARD} .animate-hint-reveal-glow[data-selected]`).get("animation")).toBe("none");
        });

        it.each([["flashing", FLASH], ["glowing", GLOW]])("should print a %s cell's digits in the foreground ink, as the board model counts", (_state, selector) => {
            const declarations = declarationsOf(PIXEL_CSS, selector);

            expect(declarations.get("--pixel-clue-ink")).toBe("var(--color-foreground)");
            expect(declarations.get("--pixel-entry-ink")).toBe("var(--color-foreground)");
        });

        it("should mark a completed group with a still fill under reduced motion, as other styles keep their colour flash", () => {
            const still = reducedMotionDeclarationsOf(FLASH);

            expect(still.get("animation")).toBe("none");
            // The flash's own peak colour, for the 500ms each cell keeps the class
            expect(still.get("background-color")).toBe("var(--color-highlight)");
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
