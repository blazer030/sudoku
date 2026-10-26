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
