import { afterEach, describe, expect, it, vi } from "vitest";

const ANDROID_WEBVIEW_126 = "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.6478.134 Mobile Safari/537.36";
const CHROME_120 = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.109 Safari/537.36";
const CHROME_119 = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.105 Safari/537.36";
const HEADLESS_CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/136.0.7103.25 Safari/537.36";
const EDGE = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0";
const FIREFOX = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/137.0";
const SAFARI_MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Safari/605.1.15";
const SAFARI_IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1";
const CHROME_IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1";
const FIREFOX_IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/132.0 Mobile/15E148 Safari/605.1.15";

const loadModule = async () => {
    vi.resetModules();
    return import("@/presentation/components/style-moments/maskReferenceSupport");
};

describe("mask reference support", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it.each([
        ["Android WebView 126", ANDROID_WEBVIEW_126],
        ["Chrome 120", CHROME_120],
        ["headless Chrome", HEADLESS_CHROME],
        ["Edge", EDGE],
        ["Firefox", FIREFOX],
    ])("should let %s mask a digit by an SVG mask", async (_name, userAgent) => {
        const { masksByReferenceIn } = await loadModule();

        expect(masksByReferenceIn(userAgent)).toBe(true);
    });

    // WebKit (Safari, and every browser on iOS) never shows the masked digit, and Chromium only resolves
    // an SVG mask on an HTML element from 120
    it.each([
        ["Chrome 119", CHROME_119],
        ["Safari on macOS", SAFARI_MAC],
        ["Safari on iOS", SAFARI_IOS],
        ["Chrome on iOS", CHROME_IOS],
        ["Firefox on iOS", FIREFOX_IOS],
        ["an unknown engine", "jsdom"],
    ])("should not let %s mask a digit by an SVG mask", async (_name, userAgent) => {
        const { masksByReferenceIn } = await loadModule();

        expect(masksByReferenceIn(userAgent)).toBe(false);
    });

    it("should read the browser once and keep the answer", async () => {
        const { canMaskByReference } = await loadModule();
        vi.stubGlobal("navigator", { userAgent: SAFARI_MAC });
        expect(canMaskByReference()).toBe(false);

        vi.stubGlobal("navigator", { userAgent: CHROME_120 });
        expect(canMaskByReference()).toBe(false);
    });
});
