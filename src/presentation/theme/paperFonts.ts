/**
 * Paper's handwriting is Caveat, bundled with the app (src/style/fonts.css; the web app's service
 * worker precaches it for everyone). A page loads the face once paper's text uses it, and paper
 * enlarges its handwriting only once it has loaded (data-paper-fonts="ready" on <html>); until
 * then the fallback faces stay full-size.
 */

const HANDWRITING_DIGITS = "0123456789";
// The weights paper writes in. document.fonts.check() is true when no face matches at all, so
// only faces that load() returns as loaded count.
const HANDWRITING_FACES = ["500 16px Caveat", "700 16px Caveat"];

const handwritingLoaded = async (): Promise<boolean> => {
    // Old WebViews and jsdom may lack the font loading API
    const fonts = (document as Partial<Document>).fonts;
    if (fonts === undefined) return false;
    try {
        const matches = await Promise.all(HANDWRITING_FACES.map(face => fonts.load(face, HANDWRITING_DIGITS)));
        return matches.every(faces => faces.some(face => face.status === "loaded"));
    } catch {
        return false;
    }
};

/** Marks <html> once paper's handwriting has loaded, and drops the mark when leaving paper. */
export const syncPaperFonts = (active: boolean): void => {
    const root = document.documentElement;
    if (!active) {
        delete root.dataset.paperFonts;
        return;
    }
    if (root.dataset.paperFonts === "ready") return;
    void handwritingLoaded().then((loaded) => {
        // The player may have left paper while the fonts were loading
        if (loaded && root.dataset.style === "paper") root.dataset.paperFonts = "ready";
    });
};
