import { readFileSync } from "fs";
import { STYLE_IDS, THEME_IDS_BY_STYLE } from "@/theme/themeIds";
import { systemBarColor } from "@/theme/palettes";

const extractInlineScript = (): string => {
    const html = readFileSync("index.html", "utf8");
    const match = /<script>([\s\S]*?)<\/script>/.exec(html);
    if (match === null) throw new Error("index.html has no inline <script> without attributes");
    return match[1];
};

const runInlineScript = (source: string = extractInlineScript()) => {
    // index.html's script is plain text; running it is the point of this test
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const script = new Function(source) as () => void;
    script();
};

// The script with one more style entry, to exercise shapes no shipped style has yet
const withBarColors = (entries: string): string =>
    extractInlineScript().replace("var barColors = {", `var barColors = {\n${entries},`);

const stubSystemDark = (dark: boolean) => {
    vi.stubGlobal("matchMedia", (query: string) => ({
        matches: query === "(prefers-color-scheme: dark)" && dark,
        media: query,
    }));
};

const storeSettings = (settings: Record<string, unknown>) => {
    localStorage.setItem("sudoku-settings", JSON.stringify(settings));
};

const stylesheetHrefs = (): string[] =>
    [...document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map(link => link.getAttribute("href") ?? "");

describe("index.html no-flash script", () => {
    const root = document.documentElement;
    let meta: HTMLMetaElement;

    beforeEach(() => {
        localStorage.clear();
        meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
    });

    afterEach(() => {
        meta.remove();
        document.head.querySelectorAll('link[rel="stylesheet"]').forEach((link) => { link.remove(); });
        vi.unstubAllGlobals();
        localStorage.clear();
        root.className = "";
        delete root.dataset.style;
        delete root.dataset.colorTheme;
    });

    it("should apply a stored dark appearance and color theme", () => {
        stubSystemDark(false);
        storeSettings({ appearance: "dark", colorTheme: "blue" });

        runInlineScript();

        expect(root.classList.contains("dark")).toBe(true);
        expect(root.dataset.colorTheme).toBe("blue");
        expect(root.dataset.style).toBe("minimal");
    });

    it("should follow a dark system for system appearance", () => {
        stubSystemDark(true);
        storeSettings({ appearance: "system" });

        runInlineScript();

        expect(root.classList.contains("dark")).toBe(true);
    });

    it("should paint paper light with its light bar colour even when dark is stored", () => {
        stubSystemDark(true);
        storeSettings({ style: "paper", colorTheme: "blueInk", appearance: "dark" });

        runInlineScript();

        expect(root.classList.contains("dark")).toBe(false);
        expect(meta.content).toBe(systemBarColor("paper", "blueInk", "light"));
    });

    it("should paint a dark-only style dark with its bar colour even when light is stored", () => {
        stubSystemDark(false);
        storeSettings({ style: "night", colorTheme: "ember", appearance: "light" });

        runInlineScript(withBarColors('night: { dark: { glow: "#010203", ember: "#040506" } }'));

        expect(root.dataset.style).toBe("night");
        expect(root.dataset.colorTheme).toBe("ember");
        expect(root.classList.contains("dark")).toBe(true);
        expect(meta.content).toBe("#040506");
    });

    it("should fall to a dark-only style's first theme when the stored one is not its own", () => {
        stubSystemDark(false);
        storeSettings({ style: "night", colorTheme: "green" });

        runInlineScript(withBarColors('night: { dark: { glow: "#010203", ember: "#040506" } }'));

        expect(root.dataset.colorTheme).toBe("glow");
        expect(meta.content).toBe("#010203");
    });

    // Review Focus 3: no flash of minimal on a cold start in pixel
    it.each([
        { appearance: "light", dark: false, barColor: "#0F380F" },
        { appearance: "dark", dark: true, barColor: "#000000" },
    ])("should paint pixel in $appearance with its own bar colour", ({ appearance, dark, barColor }) => {
        stubSystemDark(false);
        storeSettings({ style: "pixel", colorTheme: "classic", appearance });

        runInlineScript();

        expect(root.dataset.style).toBe("pixel");
        expect(root.dataset.colorTheme).toBe("classic");
        expect(root.classList.contains("dark")).toBe(dark);
        expect(meta.content).toBe(barColor);
        expect(meta.content).toBe(systemBarColor("pixel", "classic", appearance as "light" | "dark"));
    });

    // Review Focus 1: cyber is dark only, whatever appearance is stored
    it.each([{ appearance: "light" }, { appearance: undefined }])("should paint cyber dark with its bar colour when appearance is $appearance", ({ appearance }) => {
        stubSystemDark(false);
        storeSettings({ style: "cyber", appearance });

        runInlineScript();

        expect(root.dataset.style).toBe("cyber");
        expect(root.dataset.colorTheme).toBe("neon");
        expect(root.classList.contains("dark")).toBe(true);
        expect(meta.content).toBe("#07070D");
        expect(meta.content).toBe(systemBarColor("cyber", "neon", "dark"));
    });

    it("should paint paper light for a stored system appearance on a dark system", () => {
        stubSystemDark(true);
        storeSettings({ style: "paper", appearance: "system" });

        runInlineScript();

        expect(root.classList.contains("dark")).toBe(false);
    });

    it("should switch to dark when the style changes from paper to minimal while dark is stored", () => {
        stubSystemDark(false);
        storeSettings({ style: "paper", appearance: "dark" });
        runInlineScript();
        root.className = "";

        storeSettings({ style: "minimal", appearance: "dark" });
        runInlineScript();

        expect(root.classList.contains("dark")).toBe(true);
    });

    it("should stay light for light appearance on a dark system", () => {
        stubSystemDark(true);
        storeSettings({ appearance: "light" });

        runInlineScript();

        expect(root.classList.contains("dark")).toBe(false);
    });

    it("should default to light green when nothing is stored on a light system", () => {
        stubSystemDark(false);

        runInlineScript();

        expect(root.className).toBe("");
        expect(root.dataset.colorTheme).toBe("green");
        expect(root.dataset.style).toBe("minimal");
    });

    it("should ignore corrupt stored settings", () => {
        stubSystemDark(false);
        localStorage.setItem("sudoku-settings", "{");

        expect(runInlineScript).not.toThrow();
        expect(root.className).toBe("");
    });

    it("should survive a missing matchMedia", () => {
        vi.stubGlobal("matchMedia", undefined);
        storeSettings({ appearance: "system" });

        expect(runInlineScript).not.toThrow();
        expect(root.classList.contains("dark")).toBe(false);
    });

    it("should accept every style id the app knows", () => {
        stubSystemDark(false);
        for (const styleId of STYLE_IDS) {
            storeSettings({ style: styleId });
            runInlineScript();
            expect(root.dataset.style).toBe(styleId);
        }
    });

    it("should accept every color theme id the app knows", () => {
        stubSystemDark(false);
        for (const style of STYLE_IDS) {
            for (const themeId of THEME_IDS_BY_STYLE[style]) {
                storeSettings({ style, colorTheme: themeId });
                runInlineScript();
                expect(root.dataset.colorTheme, `${style}/${themeId}`).toBe(themeId);
            }
        }
    });

    it("should set the theme-color meta for every theme and mode", () => {
        stubSystemDark(false);
        for (const style of STYLE_IDS) {
            for (const themeId of THEME_IDS_BY_STYLE[style]) {
                for (const mode of ["light", "dark"] as const) {
                    storeSettings({ style, colorTheme: themeId, appearance: mode });
                    runInlineScript();
                    expect(meta.content, `${style}/${themeId}/${mode}`).toBe(systemBarColor(style, themeId, mode));
                }
            }
        }
    });

    it("should fall back like loadSettings when the theme belongs to another style", () => {
        stubSystemDark(false);
        storeSettings({ style: "tactile", colorTheme: "teal", colorThemeByStyle: { tactile: "slate" } });
        runInlineScript();
        expect(root.dataset.colorTheme).toBe("slate");
        expect(meta.content).toBe(systemBarColor("tactile", "slate", "light"));

        storeSettings({ style: "tactile", colorTheme: "teal" });
        runInlineScript();
        expect(root.dataset.colorTheme).toBe("green");
        expect(meta.content).toBe(systemBarColor("tactile", "green", "light"));
    });

    it("should use the default theme's colour for an unknown theme", () => {
        stubSystemDark(false);
        storeSettings({ colorTheme: "red" });

        runInlineScript();

        expect(root.dataset.colorTheme).toBe("green");
        expect(meta.content).toBe(systemBarColor("minimal", "green", "light"));
    });

    it.each(["paper", "minimal", "tactile", undefined])("should add no font stylesheet for style %s, since the fonts are bundled", (style) => {
        stubSystemDark(false);
        storeSettings({ style });

        runInlineScript();

        expect(stylesheetHrefs()).toEqual([]);
    });
});
