// The step is a share of the key's width (15px on a 56px key), so it holds when keys shrink. The key must be
// a size container (`@container`) for it to resolve.
const NOTE_PLACE_STEP = 27;

/** In note mode a key's digit moves to its place in a cell's 3×3 note grid: 1 top left … 9 bottom right. */
export const noteGlyphStyle = (digit: number, noteMode: boolean): { transform: string } | undefined => {
    if (!noteMode) return undefined;
    const column = (digit - 1) % 3 - 1;
    const row = Math.floor((digit - 1) / 3) - 1;
    return { transform: `translate(${column * NOTE_PLACE_STEP}cqw, ${row * NOTE_PLACE_STEP}cqw)` };
};
