/**
 * The 8-bit style's type is bundled with the app (src/style/fonts.css; the web app's service worker
 * precaches it for everyone): Press Start 2P for digits, Silkscreen for notes and Cubic 11 for the
 * rest. A page loads the faces once pixel uses them, and pixel switches to them only once all three
 * have loaded (data-pixel-fonts="ready" on <html>); until then the fallback faces stay.
 */

import { markFontsReady } from "@/style/fontGate";

const DIGITS = "0123456789";
const PIXEL_FACES = ['16px "Press Start 2P"', '16px "Silkscreen"', '16px "Cubic 11"'];

/** Marks <html> once pixel's faces have loaded, and drops the mark when leaving pixel. */
export const syncPixelFonts = markFontsReady({ style: "pixel", datasetKey: "pixelFonts", faces: PIXEL_FACES, sample: DIGITS });
