/**
 * The chalkboard style's digits are Caveat Brush, bundled with the app (src/style/fonts.css; the web app's
 * service worker precaches it for everyone) under its own family name, Chalk Digits, so no other style's
 * stack reaches it. A page loads the face once chalkboard uses it, and chalkboard switches to it only once it
 * has loaded (data-chalkboard-fonts="ready" on <html>); until then the fallback face stays.
 */
import { markFontsReady } from "@/style/fontGate";

/** Marks <html> once Chalk Digits has loaded, and drops the mark when leaving chalkboard. */
export const syncChalkboardFonts = markFontsReady({
    style: "chalkboard",
    datasetKey: "chalkboardFonts",
    faces: ['16px "Chalk Digits"'],
    sample: "0123456789",
});
