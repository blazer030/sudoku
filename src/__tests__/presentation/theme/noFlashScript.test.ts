import { readFileSync } from "fs";

const extractInlineScript = (): string => {
    const html = readFileSync("index.html", "utf8");
    const match = /<script>([\s\S]*?)<\/script>/.exec(html);
    if (match === null) throw new Error("index.html has no inline <script> without attributes");
    return match[1];
};

const runInlineScript = () => {
    // index.html's script is plain text; running it is the point of this test
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const script = new Function(extractInlineScript()) as () => void;
    script();
};

const stubSystemDark = (dark: boolean) => {
    vi.stubGlobal("matchMedia", (query: string) => ({
        matches: query === "(prefers-color-scheme: dark)" && dark,
        media: query,
    }));
};

const storeSettings = (settings: Record<string, unknown>) => {
    localStorage.setItem("sudoku-settings", JSON.stringify(settings));
};

describe("index.html no-flash script", () => {
    const root = document.documentElement;

    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
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
});
