/**
 * The 8-bit style's type is bundled with the app (src/style/fonts.css; the web app's service worker
 * precaches it for everyone): Press Start 2P for digits, Silkscreen for notes and Cubic 11 for the
 * rest. A page loads the faces once pixel uses them, and pixel switches to them only once all three
 * have loaded (data-pixel-fonts="ready" on <html>); until then the fallback faces stay.
 */

const DIGITS = "0123456789";
// document.fonts.check() is true when no face matches at all, so only faces that load() returns as
// loaded count.
const PIXEL_FACES = ['16px "Press Start 2P"', '16px "Silkscreen"', '16px "Cubic 11"'];

const pixelFacesLoaded = async (): Promise<boolean> => {
    // Old WebViews and jsdom may lack the font loading API
    const fonts = (document as Partial<Document>).fonts;
    if (fonts === undefined) return false;
    try {
        const matches = await Promise.all(PIXEL_FACES.map(face => fonts.load(face, DIGITS)));
        return matches.every(faces => faces.some(face => face.status === "loaded"));
    } catch {
        return false;
    }
};

/** Marks <html> once pixel's faces have loaded, and drops the mark when leaving pixel. */
export const syncPixelFonts = (active: boolean): void => {
    const root = document.documentElement;
    if (!active) {
        delete root.dataset.pixelFonts;
        return;
    }
    if (root.dataset.pixelFonts === "ready") return;
    void pixelFacesLoaded().then((loaded) => {
        // The player may have left pixel while the fonts were loading
        if (loaded && root.dataset.style === "pixel") root.dataset.pixelFonts = "ready";
    });
};
