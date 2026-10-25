import { syncCyberFonts } from "@/style/styles/cyber/fonts";

describe("syncCyberFonts", () => {
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
        root.dataset.style = "cyber";
    });

    afterEach(() => {
        Reflect.deleteProperty(document, "fonts");
        delete root.dataset.style;
        delete root.dataset.cyberFonts;
        finishLoading = [];
    });

    it("should mark <html> once Orbitron and Share Tech Mono have loaded", async () => {
        const load = stubFontLoading({});

        syncCyberFonts(true);
        expect(root.dataset.cyberFonts).toBeUndefined();
        await finishLoadingFonts();

        const families = load.mock.calls.map(([font]) => font).join(" ");
        expect(families).toContain("Orbitron");
        expect(families).toContain("Share Tech Mono");
        expect(root.dataset.cyberFonts).toBe("ready");
    });

    it("should not mark while any face failed to load", async () => {
        stubFontLoading({ '16px "Share Tech Mono"': "error" });

        syncCyberFonts(true);
        await finishLoadingFonts();

        expect(root.dataset.cyberFonts).toBeUndefined();
    });

    it("should drop the mark when leaving cyber", async () => {
        stubFontLoading({});
        syncCyberFonts(true);
        await finishLoadingFonts();

        syncCyberFonts(false);

        expect(root.dataset.cyberFonts).toBeUndefined();
    });

    it("should not mark when the player left cyber while the fonts were loading", async () => {
        stubFontLoading({});
        syncCyberFonts(true);

        root.dataset.style = "minimal";
        await finishLoadingFonts();

        expect(root.dataset.cyberFonts).toBeUndefined();
    });

    it("should do nothing without the font loading API", async () => {
        syncCyberFonts(true);
        await new Promise((resolve) => { setTimeout(resolve, 0); });

        expect(root.dataset.cyberFonts).toBeUndefined();
    });
});
