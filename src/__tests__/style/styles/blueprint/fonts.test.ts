import { readFileSync } from "fs";
import postcss from "postcss";
import { syncBlueprintFonts } from "@/style/styles/blueprint/fonts";

const BLUEPRINT_FAMILIES = ["Blueprint Mono", "Blueprint Hand", "Blueprint Sans TC"];

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

describe("blueprint font stacks", () => {
    it("should set mono text in Blueprint Mono, falling to Blueprint Sans TC", () => {
        expect(families(themeFonts().get("--font-blueprint-mono") ?? "").slice(0, 2)).toEqual(["Blueprint Mono", "Blueprint Sans TC"]);
    });

    it("should set the player's digits in Blueprint Hand, falling to Mono and then Sans TC", () => {
        expect(families(themeFonts().get("--font-blueprint-hand") ?? "").slice(0, 3)).toEqual(["Blueprint Hand", "Blueprint Mono", "Blueprint Sans TC"]);
    });

    it("should set other text in Blueprint Sans TC, falling to system faces", () => {
        expect(families(themeFonts().get("--font-blueprint-sans") ?? "").slice(0, 3)).toEqual(["Blueprint Sans TC", "PingFang TC", "Microsoft JhengHei"]);
    });

    it("should keep the blueprint families out of every other style's stacks", () => {
        const others = [...themeFonts()].filter(([token]) => !token.startsWith("--font-blueprint-"));

        for (const [token, stack] of others) {
            for (const family of BLUEPRINT_FAMILIES) {
                expect(families(stack), `${token} ${family}`).not.toContain(family);
            }
        }
    });
});

describe("blueprint @font-face rules", () => {
    it("should declare each family with font-display swap", () => {
        const swapped = new Set<string>();
        postcss.parse(readFileSync("src/style/fonts.css", "utf8")).walkAtRules("font-face", (atRule) => {
            const declarations = new Map<string, string>();
            atRule.walkDecls((declaration) => { declarations.set(declaration.prop, declaration.value.trim()); });
            const family = (declarations.get("font-family") ?? "").replace(/"/g, "");
            if (BLUEPRINT_FAMILIES.includes(family) && declarations.get("font-display") === "swap") swapped.add(family);
        });

        expect([...swapped].sort()).toEqual([...BLUEPRINT_FAMILIES].sort());
    });
});

describe("syncBlueprintFonts", () => {
    const root = document.documentElement;
    let finishLoading: (() => void)[] = [];

    // load() resolves with a face of the given status once finishLoadingFonts() is called
    const stubFontLoading = (statuses: (font: string) => string) => {
        const load = vi.fn((font: string) => new Promise<{ status: string }[]>((resolve) => {
            finishLoading.push(() => { resolve([{ status: statuses(font) }]); });
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
        root.dataset.style = "blueprint";
    });

    afterEach(() => {
        Reflect.deleteProperty(document, "fonts");
        delete root.dataset.style;
        delete root.dataset.blueprintFonts;
        finishLoading = [];
    });

    it("should mark <html> once all five faces have loaded", async () => {
        const load = stubFontLoading(() => "loaded");

        syncBlueprintFonts(true);
        expect(root.dataset.blueprintFonts).toBeUndefined();
        await finishLoadingFonts();

        expect(load.mock.calls.map(([font]) => font)).toEqual([
            '400 16px "Blueprint Mono"',
            '500 16px "Blueprint Mono"',
            '600 16px "Blueprint Mono"',
            '16px "Blueprint Hand"',
            '300 16px "Blueprint Sans TC"',
        ]);
        expect(root.dataset.blueprintFonts).toBe("ready");
    });

    it("should not mark while one face failed to load", async () => {
        stubFontLoading(font => (font.includes("Blueprint Hand") ? "error" : "loaded"));

        syncBlueprintFonts(true);
        await finishLoadingFonts();

        expect(root.dataset.blueprintFonts).toBeUndefined();
    });

    it("should drop the mark when leaving blueprint", async () => {
        stubFontLoading(() => "loaded");
        syncBlueprintFonts(true);
        await finishLoadingFonts();

        syncBlueprintFonts(false);

        expect(root.dataset.blueprintFonts).toBeUndefined();
    });

    it("should do nothing without the font loading API", async () => {
        syncBlueprintFonts(true);
        await new Promise((resolve) => { setTimeout(resolve, 0); });

        expect(root.dataset.blueprintFonts).toBeUndefined();
    });
});
