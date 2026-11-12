// What every app icon's artwork shares: its 108-unit square and the adaptive icon's layers. The style
// icons and the brand icon draw on it. Relative imports only.

/** The artwork's side, in units: an adaptive icon's 108dp layer. */
export const ICON_SIZE = 108;
// An adaptive icon's 108dp layers show their middle 72dp, so the foreground fits the artwork there
export const ADAPTIVE_VIEWPORT = 72;
/** The margin round the shown 72dp, on each side of the 108dp layer. */
export const ADAPTIVE_INSET = (ICON_SIZE - ADAPTIVE_VIEWPORT) / 2;
// Android tints the monochrome layer itself and reads only its alpha
export const MONOCHROME_COLOR = "#FFFFFF";

/** A full 108-unit square SVG of the content. */
export const svgOf = (...content: string[]): string => [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ICON_SIZE} ${ICON_SIZE}">`,
    ...content,
    "</svg>",
    "",
].join("\n");

/** The artwork scaled into the part of an adaptive layer the launcher shows. */
export const inAdaptiveViewport = (...content: string[]): string[] =>
    [`<g transform="translate(${ADAPTIVE_INSET} ${ADAPTIVE_INSET}) scale(${ADAPTIVE_VIEWPORT / ICON_SIZE})">`, ...content, "</g>"];
