/**
 * Paper's handwriting and interface faces. Only paper uses them, so they load only while paper
 * is the style: index.html's inline script adds them at startup and appearance sync on a switch.
 * Caveat writes digits only, so its request is cut down to them. Paper enlarges its handwriting
 * only once Caveat has loaded (data-paper-fonts="ready" on <html>); the fallbacks stay full-size.
 */
export const PAPER_FONT_URLS: readonly string[] = [
    "https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&text=0123456789&display=swap",
    "https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@400;700&display=swap",
];

// index.html's inline script marks its links the same way, so they are found and kept
const LINK_MARKER = "data-paper-font-link";

const paperFontLinks = (): HTMLLinkElement[] => [...document.head.querySelectorAll<HTMLLinkElement>(`link[${LINK_MARKER}]`)];

/** Adds each paper font stylesheet once while paper is active and removes them all otherwise. */
const syncPaperFontLinks = (active: boolean): void => {
    const links = paperFontLinks();
    if (!active) {
        links.forEach((link) => { link.remove(); });
        return;
    }
    for (const url of PAPER_FONT_URLS) {
        if (links.some(link => link.getAttribute("href") === url)) continue;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        link.setAttribute(LINK_MARKER, "");
        document.head.appendChild(link);
    }
};

const HANDWRITING_DIGITS = "0123456789";
// The weights paper writes in. document.fonts.check() is true when no face matches at all, so
// only faces that load() returns as loaded count.
const HANDWRITING_FACES = ["500 16px Caveat", "700 16px Caveat"];

const stylesheetLoaded = (link: HTMLLinkElement): Promise<void> => {
    if (link.sheet !== null) return Promise.resolve();
    return new Promise((resolve, reject) => {
        link.addEventListener("load", () => { resolve(); }, { once: true });
        link.addEventListener("error", () => { reject(new Error(`Could not load ${link.href}`)); }, { once: true });
    });
};

const handwritingLoaded = async (): Promise<boolean> => {
    // Old WebViews and jsdom may lack the font loading API
    const fonts = (document as Partial<Document>).fonts;
    const link = paperFontLinks().find(candidate => candidate.getAttribute("href") === PAPER_FONT_URLS[0]);
    if (fonts === undefined || link === undefined) return false;
    try {
        await stylesheetLoaded(link);
        const matches = await Promise.all(HANDWRITING_FACES.map(face => fonts.load(face, HANDWRITING_DIGITS)));
        return matches.every(faces => faces.some(face => face.status === "loaded"));
    } catch {
        // Blocked or offline
        return false;
    }
};

/** Loads paper's fonts while paper is the style, and marks <html> once its handwriting is ready. */
export const syncPaperFonts = (active: boolean): void => {
    const root = document.documentElement;
    syncPaperFontLinks(active);
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
