import { readFileSync } from "fs";
import postcss from "postcss";
import { syncInkFonts } from "@/style/styles/ink/fonts";

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

describe("ink font stacks", () => {
    // Yuji Boku is cut to the brush strings: any other character, such as 「產」 in a new title, falls to a 楷 face
    it("should fall from Yuji Boku to LXGW WenKai TC, which covers every character the app writes", () => {
        const brush = families(themeFonts().get("--font-ink-brush") ?? "");

        expect(brush.slice(0, 2)).toEqual(["Yuji Boku", "LXGW WenKai TC"]);
    });

    it("should set ink's text in Noto Serif TC and its digits in EB Garamond", () => {
        const fonts = themeFonts();

        expect(families(fonts.get("--font-ink-serif") ?? "")[0]).toBe("Noto Serif TC");
        expect(families(fonts.get("--font-ink-digits") ?? "")[0]).toBe("EB Garamond");
    });
});

describe("syncInkFonts", () => {
    const root = document.documentElement;
    let finishLoading: (() => void)[] = [];

    // load() resolves with a face of the given status once finishLoadingFonts() is called
    const stubFontLoading = (statuses: Record<string, string>) => {
        const load = vi.fn((font: string) => new Promise<{ status: string }[]>((resolve) => {
            finishLoading.push(() => { resolve([{ status: statuses[font] ?? "loaded" }]); });
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
        root.dataset.style = "ink";
    });

    afterEach(() => {
        Reflect.deleteProperty(document, "fonts");
        delete root.dataset.style;
        delete root.dataset.inkFonts;
        finishLoading = [];
    });

    it("should mark <html> once Yuji Boku, Noto Serif TC and EB Garamond have loaded", async () => {
        const load = stubFontLoading({});

        syncInkFonts(true);
        expect(root.dataset.inkFonts).toBeUndefined();
        await finishLoadingFonts();

        const loaded = load.mock.calls.map(([font]) => font).join(" ");
        expect(loaded).toContain("Yuji Boku");
        expect(loaded).toContain("Noto Serif TC");
        expect(loaded).toContain("EB Garamond");
        expect(root.dataset.inkFonts).toBe("ready");
    });

    it("should not mark while the italic digits failed to load", async () => {
        stubFontLoading({ 'italic 500 16px "EB Garamond"': "error" });

        syncInkFonts(true);
        await finishLoadingFonts();

        expect(root.dataset.inkFonts).toBeUndefined();
    });

    it("should drop the mark when leaving ink", async () => {
        stubFontLoading({});
        syncInkFonts(true);
        await finishLoadingFonts();

        syncInkFonts(false);

        expect(root.dataset.inkFonts).toBeUndefined();
    });

    it("should do nothing without the font loading API", async () => {
        syncInkFonts(true);
        await new Promise((resolve) => { setTimeout(resolve, 0); });

        expect(root.dataset.inkFonts).toBeUndefined();
    });
});
