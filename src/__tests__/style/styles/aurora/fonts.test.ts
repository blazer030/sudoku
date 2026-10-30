import { readFileSync } from "fs";
import postcss from "postcss";
import { syncAuroraFonts } from "@/style/styles/aurora/fonts";

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

const skinDeclarations = (selector: string): Map<string, string> => {
    const declarations = new Map<string, string>();
    postcss.parse(readFileSync("src/style/styles/aurora/skin.css", "utf8")).walkRules((rule) => {
        if (!rule.selectors.includes(selector)) return;
        rule.walkDecls((declaration) => { declarations.set(declaration.prop, declaration.value.trim()); });
    });
    return declarations;
};

describe("aurora font stack", () => {
    it("should lead with Outfit, then Aurora Sans TC", () => {
        expect(families(themeFonts().get("--font-aurora-sans") ?? "").slice(0, 2)).toEqual(["Outfit", "Aurora Sans TC"]);
    });

    it("should keep Aurora Sans TC out of every other style's stack", () => {
        for (const [token, stack] of themeFonts()) {
            if (token === "--font-aurora-sans") continue;
            expect(families(stack), token).not.toContain("Aurora Sans TC");
        }
    });

    it("should keep Blueprint Sans TC out of aurora's stack", () => {
        expect(families(themeFonts().get("--font-aurora-sans") ?? "")).not.toContain("Blueprint Sans TC");
    });
});

describe("aurora skin fonts", () => {
    const FONTS_READY = '[data-style="aurora"][data-aurora-fonts="ready"]';

    it("should repoint the sans token only once the faces are ready", () => {
        expect(skinDeclarations(FONTS_READY).get("--font-sans")).toBe("var(--font-aurora-sans)");
    });

    // Only the face changes at the gate, never the weight: the heaviest bundled weight is 600
    it("should set titles at 600 whether or not the faces are ready", () => {
        expect(skinDeclarations('[data-style="aurora"] [data-skin~="title"]').get("font-weight")).toBe("600");
        expect(skinDeclarations(`${FONTS_READY} [data-skin~="title"]`).has("font-weight")).toBe(false);
    });

    // Only the face changes at the gate, never the weight
    it("should set dialog titles at 600 whether or not the faces are ready", () => {
        expect(skinDeclarations('[data-style="aurora"] [data-skin~="dialog-title"]').get("font-weight")).toBe("600");
        expect(skinDeclarations(`${FONTS_READY} [data-skin~="dialog-title"]`).has("font-weight")).toBe(false);
    });
});

describe("syncAuroraFonts", () => {
    const root = document.documentElement;
    let finishLoading: (() => void)[] = [];

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
        root.dataset.style = "aurora";
    });

    afterEach(() => {
        Reflect.deleteProperty(document, "fonts");
        delete root.dataset.style;
        delete root.dataset.auroraFonts;
        finishLoading = [];
    });

    it("should mark <html> once both faces have loaded", async () => {
        const load = stubFontLoading(() => "loaded");

        syncAuroraFonts(true);
        expect(root.dataset.auroraFonts).toBeUndefined();
        await finishLoadingFonts();

        expect(load.mock.calls.map(([font]) => font)).toEqual(['400 16px "Aurora Sans TC"', '600 16px "Aurora Sans TC"']);
        expect(root.dataset.auroraFonts).toBe("ready");
    });

    it("should not mark while one face failed to load", async () => {
        stubFontLoading(font => (font.startsWith("600") ? "error" : "loaded"));

        syncAuroraFonts(true);
        await finishLoadingFonts();

        expect(root.dataset.auroraFonts).toBeUndefined();
    });

    it("should drop the mark when leaving aurora", async () => {
        stubFontLoading(() => "loaded");
        syncAuroraFonts(true);
        await finishLoadingFonts();

        syncAuroraFonts(false);

        expect(root.dataset.auroraFonts).toBeUndefined();
    });

    it("should do nothing without the font loading API", async () => {
        syncAuroraFonts(true);
        await new Promise((resolve) => { setTimeout(resolve, 0); });

        expect(root.dataset.auroraFonts).toBeUndefined();
    });
});
