import { readFileSync } from "fs";
import postcss from "postcss";
import { syncChalkboardFonts } from "@/style/styles/chalkboard/fonts";

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

const families = (stack: string): string[] => stack.split(",").map(family => family.trim().replace(/"/g, ""));

describe("chalkboard font stack", () => {
    it("should set chalk's digits in Chalk Digits and fall to WenKai", () => {
        expect(families(themeFonts().get("--font-chalkboard-digits") ?? "").slice(0, 2)).toEqual(["Chalk Digits", "LXGW WenKai TC"]);
    });

    it("should keep Chalk Digits out of every other style's stacks", () => {
        const others = [...themeFonts()].filter(([token]) => !token.startsWith("--font-chalkboard-"));

        for (const [token, stack] of others) {
            expect(families(stack), token).not.toContain("Chalk Digits");
        }
    });
});

// The declarations of the @font-face rule naming a family
const fontFaceOf = (family: string): Map<string, string> => {
    const declarations = new Map<string, string>();
    postcss.parse(readFileSync("src/style/fonts.css", "utf8")).walkAtRules("font-face", (atRule) => {
        const faceDeclarations = new Map<string, string>();
        atRule.walkDecls((declaration) => { faceDeclarations.set(declaration.prop, declaration.value.trim()); });
        if (faceDeclarations.get("font-family")?.replace(/"/g, "") === family) {
            faceDeclarations.forEach((value, property) => { declarations.set(property, value); });
        }
    });
    return declarations;
};

describe("chalkboard's two faces on one Caveat Brush file", () => {
    it("should limit Chalk Digits to digits and the colon, slash and percent, so English mono text keeps WenKai", () => {
        expect(fontFaceOf("Chalk Digits").get("unicode-range")).toBe("U+0025, U+002F, U+0030-003A");
    });

    it("should declare Chalk Cheer on the same file, for the English cheer only", () => {
        const cheer = fontFaceOf("Chalk Cheer");

        expect(cheer.get("src")).toBeDefined();
        expect(cheer.get("src")).toBe(fontFaceOf("Chalk Digits").get("src"));
        expect(cheer.get("unicode-range")).toBeUndefined();
    });

    it("should set the cheer in Chalk Cheer and fall to WenKai", () => {
        expect(families(themeFonts().get("--font-chalkboard-cheer") ?? "").slice(0, 2)).toEqual(["Chalk Cheer", "LXGW WenKai TC"]);
    });

    it("should keep Chalk Cheer out of every other stack", () => {
        const others = [...themeFonts()].filter(([token]) => token !== "--font-chalkboard-cheer");

        for (const [token, stack] of others) {
            expect(families(stack), token).not.toContain("Chalk Cheer");
        }
    });
});

describe("syncChalkboardFonts", () => {
    const root = document.documentElement;
    let finishLoading: (() => void)[] = [];

    // load() resolves with a face of the given status once finishLoadingFonts() is called
    const stubFontLoading = (status: string) => {
        const load = vi.fn((_font: string) => new Promise<{ status: string }[]>((resolve) => {
            finishLoading.push(() => { resolve([{ status }]); });
        }));
        Object.defineProperty(document, "fonts", { configurable: true, value: { load } });
        return load;
    };

    const finishLoadingFonts = async () => {
        finishLoading.forEach((finish) => { finish(); });
        finishLoading = [];
        await new Promise((resolve) => { setTimeout(resolve, 0); });
    };

    beforeEach(() => {
        root.dataset.style = "chalkboard";
    });

    afterEach(() => {
        Reflect.deleteProperty(document, "fonts");
        delete root.dataset.style;
        delete root.dataset.chalkboardFonts;
        finishLoading = [];
    });

    it("should mark <html> once Chalk Digits has loaded", async () => {
        const load = stubFontLoading("loaded");

        syncChalkboardFonts(true);
        expect(root.dataset.chalkboardFonts).toBeUndefined();
        await finishLoadingFonts();

        expect(load.mock.calls.map(([font]) => font).join(" ")).toContain("Chalk Digits");
        expect(root.dataset.chalkboardFonts).toBe("ready");
    });

    it("should not mark while the face failed to load", async () => {
        stubFontLoading("error");

        syncChalkboardFonts(true);
        await finishLoadingFonts();

        expect(root.dataset.chalkboardFonts).toBeUndefined();
    });

    it("should drop the mark when leaving chalkboard", async () => {
        stubFontLoading("loaded");
        syncChalkboardFonts(true);
        await finishLoadingFonts();

        syncChalkboardFonts(false);

        expect(root.dataset.chalkboardFonts).toBeUndefined();
    });

    it("should do nothing without the font loading API", async () => {
        syncChalkboardFonts(true);
        await new Promise((resolve) => { setTimeout(resolve, 0); });

        expect(root.dataset.chalkboardFonts).toBeUndefined();
    });
});
