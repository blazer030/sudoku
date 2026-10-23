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

interface ShadowLayer { inset: boolean; offsetX: number; offsetY: number; blur: number }

const shadowLayers = (value: string): ShadowLayer[] => splitTopLevel(value, /,/).map((layer) => {
    const parts = splitTopLevel(layer, /\s/);
    const lengths = parts.filter(part => /^-?\d*\.?\d+(?:px|em|rem)?$/.test(part)).map(part => Number.parseFloat(part));
    return { inset: parts.includes("inset"), offsetX: lengths[0] ?? 0, offsetY: lengths[1] ?? 0, blur: lengths[2] ?? 0 };
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
        const ungated = allDeclarations(/^--font-/).filter(declaration =>
            declaration.parent?.type !== "rule" || !(declaration.parent as Rule).selector.startsWith(FONTS_READY));

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
        expect(layers).toEqual([{ inset: true, offsetX: 0, offsetY: 0, blur: 0 }]);
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

    it("should move only in steps", () => {
        const moving = allDeclarations(/^(?:animation|animation-timing-function|transition|transition-timing-function)$/)
            .filter(declaration => !isInside(declaration, atRule => atRule.name === "media"))
            .filter(declaration => declaration.value.trim() !== "none");

        expect(moving.length).toBeGreaterThan(0);
        expect(moving.filter(declaration => !declaration.value.includes("steps(")).map(declaration => declaration.toString())).toEqual([]);
    });
});
