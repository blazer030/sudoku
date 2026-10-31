/**
 * The blueprint style's faces are bundled with the app (src/style/fonts.css; the web app's service worker
 * precaches them for everyone) under their own family names so no other style's stack reaches them:
 * Blueprint Mono (IBM Plex Mono, three weights), Blueprint Hand (Architects Daughter, digits only) and
 * Blueprint Sans TC (Noto Sans TC). A page loads them once blueprint uses them, and blueprint switches to
 * them only once all have loaded (data-blueprint-fonts="ready" on <html>); until then the fallback faces stay.
 */
import { markFontsReady } from "@/style/fontGate";

/** Marks <html> once the blueprint faces have loaded, and drops the mark when leaving blueprint. */
export const syncBlueprintFonts = markFontsReady({
    style: "blueprint",
    datasetKey: "blueprintFonts",
    faces: ['400 16px "Blueprint Mono"', '500 16px "Blueprint Mono"', '600 16px "Blueprint Mono"', '16px "Blueprint Hand"', '300 16px "Blueprint Sans TC"'],
    sample: "R5C5 0123456789 藍圖",
});
