/**
 * Paper's handwriting and interface faces. Only paper uses them, so they load only while paper
 * is the style: index.html's inline script adds them at startup and appearance sync on a switch.
 * Caveat writes digits only, so its request is cut down to them.
 */
export const PAPER_FONT_URLS: readonly string[] = [
    "https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&text=0123456789&display=swap",
    "https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@400;700&display=swap",
];

// index.html's inline script marks its links the same way, so they are found and kept
const LINK_MARKER = "data-paper-font-link";

const paperFontLinks = (): HTMLLinkElement[] => [...document.head.querySelectorAll<HTMLLinkElement>(`link[${LINK_MARKER}]`)];

/** Adds each paper font stylesheet once while paper is active and removes them all otherwise. */
export const syncPaperFontLinks = (active: boolean): void => {
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
