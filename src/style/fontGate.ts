import type { StyleId } from "@/theme/themeIds";

export interface FontGateOptions {
    style: StyleId;
    // The <html> data attribute (camelCase) that is set to "ready" once the faces have loaded
    datasetKey: string;
    // CSS font shorthands to load. document.fonts.check() is true when no face matches at all, so
    // only faces that load() returns as loaded count.
    faces: readonly string[];
    // Text the faces are loaded for
    sample: string;
}

/**
 * Builds a style's font gate: marks <html> once all its faces have loaded, and drops the mark when
 * leaving the style.
 */
export const markFontsReady = ({ style, datasetKey, faces, sample }: FontGateOptions): (active: boolean) => void => {
    const facesLoaded = async (): Promise<boolean> => {
        // Old WebViews and jsdom may lack the font loading API
        const fonts = (document as Partial<Document>).fonts;
        if (fonts === undefined) return false;
        try {
            const matches = await Promise.all(faces.map(face => fonts.load(face, sample)));
            return matches.every(loaded => loaded.some(face => face.status === "loaded"));
        } catch {
            return false;
        }
    };

    return (active) => {
        const root = document.documentElement;
        if (!active) {
            Reflect.deleteProperty(root.dataset, datasetKey);
            return;
        }
        if (root.dataset[datasetKey] === "ready") return;
        void facesLoaded().then((loaded) => {
            // The player may have left the style while the fonts were loading
            if (loaded && root.dataset.style === style) root.dataset[datasetKey] = "ready";
        });
    };
};
