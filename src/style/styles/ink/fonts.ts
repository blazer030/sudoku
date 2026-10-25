/**
 * The ink style's type is bundled with the app (src/style/fonts.css; the web app's service worker
 * precaches it for everyone): Yuji Boku for the brushed titles, Noto Serif TC for all other text and
 * the seals (900), EB Garamond for digits (upright for clues, italic for the player's), each under
 * its own family name (Ink Brush, Ink Serif TC, Ink Garamond) so no other style's stack reaches it. A page loads
 * the faces once ink uses them, and ink switches to them only once all have loaded
 * (data-ink-fonts="ready" on <html>); until then the fallback faces stay.
 */
import { markFontsReady } from "@/style/fontGate";

const SAMPLE = "0123456789數獨";
const INK_FACES = ['16px "Ink Brush"', '400 16px "Ink Serif TC"', '900 16px "Ink Serif TC"', '600 16px "Ink Garamond"', 'italic 500 16px "Ink Garamond"'];

/** Marks <html> once ink's faces have loaded, and drops the mark when leaving ink. */
export const syncInkFonts = markFontsReady({ style: "ink", datasetKey: "inkFonts", faces: INK_FACES, sample: SAMPLE });
