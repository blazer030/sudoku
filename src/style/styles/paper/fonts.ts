/**
 * Paper's handwriting is Caveat, bundled with the app (src/style/fonts.css; the web app's service
 * worker precaches it for everyone). A page loads the face once paper's text uses it, and paper
 * enlarges its handwriting only once it has loaded (data-paper-fonts="ready" on <html>); until
 * then the fallback faces stay full-size.
 */

import { markFontsReady } from "@/style/fontGate";

const HANDWRITING_DIGITS = "0123456789";
// The weights paper writes in
const HANDWRITING_FACES = ["500 16px Caveat", "700 16px Caveat"];

/** Marks <html> once paper's handwriting has loaded, and drops the mark when leaving paper. */
export const syncPaperFonts = markFontsReady({ style: "paper", datasetKey: "paperFonts", faces: HANDWRITING_FACES, sample: HANDWRITING_DIGITS });
