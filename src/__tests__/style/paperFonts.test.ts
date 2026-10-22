import { readFileSync } from "fs";
import postcss from "postcss";

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
    postcss.parse(readFileSync("src/style/styles/paper.css", "utf8")).walkDecls((declaration) => {
        declarations.set(declaration.prop, declaration.value.trim());
    });
    return declarations;
};

describe("paper fonts", () => {
    it("should load Caveat and LXGW WenKai TC with swap", () => {
        const html = readFileSync("index.html", "utf8");
        const href = /<link href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)" rel="stylesheet"/.exec(html)?.[1] ?? "";

        expect(href).toContain("family=Caveat:");
        expect(href).toContain("family=LXGW+WenKai+TC:");
        expect(href).toContain("family=Outfit:");
        expect(href).toContain("display=swap");
    });

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
        expect(Number(paperDeclarations().get("--note-scale"))).toBeGreaterThanOrEqual(1.3);
    });

    it("should keep the timer in a fixed-width face so it does not jitter", () => {
        expect(themeFonts().get("--font-timer")).toBe("var(--font-sans)");
        expect(paperDeclarations().get("--font-timer")).toBe("var(--font-mono)");
        expect(readFileSync("src/presentation/pages/game/components/GameHeader.vue", "utf8")).toMatch(/class="[^"]*\bfont-timer\b[^"]*"\s+data-testid="timer"/);
    });
});
