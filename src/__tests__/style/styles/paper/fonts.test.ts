import { readFileSync } from "fs";
import postcss, { type Rule } from "postcss";

// The font tokens declared in index.css's @theme
const themeFonts = (): Map<string, string> => {
    const fonts = new Map<string, string>();
    postcss.parse(readFileSync("src/style/index.css", "utf8")).walkAtRules("theme", (atRule) => {
        atRule.walkDecls(/^--font-/, (declaration) => {
            fonts.set(declaration.prop, declaration.value.trim());
        });
    });
    return fonts;
};

const paperDeclarations = (): Map<string, string> => {
    const declarations = new Map<string, string>();
    postcss.parse(readFileSync("src/style/styles/paper/skin.css", "utf8")).walkDecls((declaration) => {
        declarations.set(declaration.prop, declaration.value.trim());
    });
    return declarations;
};

// "selector → value" for every declaration of a property in paper.css
const paperDeclarationsOf = (property: string): Map<string, string> => {
    const declarations = new Map<string, string>();
    postcss.parse(readFileSync("src/style/styles/paper/skin.css", "utf8")).walkDecls(property, (declaration) => {
        const selector = declaration.parent?.type === "rule" ? (declaration.parent as Rule).selector : "";
        declarations.set(selector.replace(/\s+/g, " "), declaration.value.trim());
    });
    return declarations;
};

const FONTS_READY = '[data-style="paper"][data-paper-fonts="ready"]';

describe("paper fonts", () => {
    it("should fall back to the app's own stacks and never to cursive", () => {
        const fonts = themeFonts();
        const literalStacks = [...fonts].filter(([, value]) => !value.startsWith("var("));

        expect(literalStacks.length).toBeGreaterThan(0);
        for (const [token, stack] of literalStacks) {
            expect(stack, token).toMatch(/(?:^|,\s*)(?:sans-serif|serif|monospace)$/);
            expect(stack, token).not.toMatch(/\b(?:cursive|fantasy)\b/);
        }
        for (const token of ["--font-hand", "--font-wenkai"]) {
            expect(fonts.get(token), token).toContain('"PingFang TC"');
            expect(fonts.get(token), token).toContain('"Noto Sans TC"');
        }
    });

    it("should write the interface in Outfit unless a style repoints it", () => {
        expect(themeFonts().get("--font-sans")).toMatch(/^"Outfit", /);
    });

    it("should write Chinese in mono text in WenKai under paper", () => {
        // 「已放棄」 in the statistics and review is font-mono; without WenKai it fell to the system font
        expect(paperDeclarations().get("--font-mono")).toBe("var(--font-mono-paper)");
        expect(themeFonts().get("--font-mono-paper")).toMatch(/^"Roboto Mono", "LXGW WenKai TC", /);
    });

    it("should not use old-style figures for clues", () => {
        expect(themeFonts().get("--font-print")).toBeDefined();
        expect(themeFonts().get("--font-print")).not.toContain("Georgia");
    });

    it("should hand paper's entries, notes and keys to the handwriting stack", () => {
        const declarations = paperDeclarations();

        expect(declarations.get("--font-entry")).toBe("var(--font-hand)");
        expect(declarations.get("--font-note")).toBe("var(--font-hand)");
        expect(declarations.get("--font-key")).toBe("var(--font-hand)");
        expect(declarations.get("--font-clue")).toBe("var(--font-print)");
    });

    it("should set handwritten notes large enough to read like minimal's", () => {
        // Caveat's digits are about 15% shorter than Outfit's at the same size; measured in a browser at
        // 360px, notes at 1.15 had 85% of minimal's ink height, so they need at least 1.3
        expect(Number(paperDeclarationsOf("--note-scale").get(FONTS_READY))).toBeGreaterThanOrEqual(1.3);
    });

    it.each(["--entry-scale", "--note-scale", "--key-scale"])("should enlarge %s only once the handwriting face has loaded", (scale) => {
        // The fallback faces are full-size digits; enlarged they would read a third larger than minimal's
        const declarations = paperDeclarationsOf(scale);

        expect([...declarations.keys()]).toEqual([FONTS_READY]);
        expect(Number(declarations.get(FONTS_READY))).toBeGreaterThan(1);
    });

    it("should keep the timer in a fixed-width face so it does not jitter", () => {
        expect(themeFonts().get("--font-timer")).toBe("var(--font-sans)");
        expect(paperDeclarations().get("--font-timer")).toBe("var(--font-mono)");
        expect(readFileSync("src/presentation/pages/game/components/GameHeader.vue", "utf8")).toMatch(/class="[^"]*\bfont-timer\b[^"]*"\s+data-testid="timer"/);
    });
});
