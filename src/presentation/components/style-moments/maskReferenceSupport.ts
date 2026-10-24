/**
 * Whether the browser can mask an HTML element by an SVG `<mask>` (`mask-image: url(#id)`), which a style's
 * digit writer needs. Where it cannot, the masked digit stays hidden until the writer is done, so the digit
 * is shown plainly instead.
 *
 * No feature test is possible without reading pixels back: `CSS.supports` accepts the syntax everywhere,
 * and hit testing ignores masks. So it goes by engine:
 * - Chromium resolves the reference on HTML elements from 120, which shipped it with unprefixed masks
 *   (Chrome, Edge, Android WebView, headless Chrome; checked on 126 and 136);
 * - Gecko has long resolved it (desktop and Android Firefox);
 * - WebKit (Safari on macOS and iOS, and every iOS browser, whose agents say CriOS or FxiOS rather than
 *   Chrome or Firefox) leaves the digit hidden, as does anything unknown.
 */

const FIRST_CHROMIUM = 120;

export const masksByReferenceIn = (userAgent: string): boolean => {
    const chromium = /Chrome\/(\d+)/.exec(userAgent);
    if (chromium) return Number(chromium[1]) >= FIRST_CHROMIUM;
    return /\bGecko\/\d+.*\bFirefox\/\d+/.test(userAgent);
};

let cachedSupport: boolean | undefined;

/** The browser's answer, read once. */
export const canMaskByReference = (): boolean => {
    cachedSupport ??= masksByReferenceIn(navigator.userAgent);
    return cachedSupport;
};
