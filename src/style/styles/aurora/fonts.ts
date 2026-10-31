/**
 * The aurora style sets its Chinese in Aurora Sans TC, the bundled Noto Sans TC file (src/style/fonts.css)
 * under its own family name so no other style's stack reaches it; the browser downloads the one file once.
 * Latin letters and digits stay in Outfit, already first in the stack. Aurora switches to the face only once
 * both weights have loaded (data-aurora-fonts="ready" on <html>); until then the fallback faces stay.
 */
import { markFontsReady } from "@/style/fontGate";

/** Marks <html> once the aurora face has loaded, and drops the mark when leaving aurora. */
export const syncAuroraFonts = markFontsReady({
    style: "aurora",
    datasetKey: "auroraFonts",
    faces: ['400 16px "Aurora Sans TC"', '600 16px "Aurora Sans TC"'],
    sample: "數獨 極光",
});
