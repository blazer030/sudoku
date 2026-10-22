/**
 * The pieces a style may set as separate plates: one per character for a title made only of
 * Han characters (數獨), otherwise the whole title as one piece.
 */
export const titleGlyphs = (title: string): string[] => {
    if (title === "") return [];
    return /^\p{Script=Han}+$/u.test(title) ? title.match(/\p{Script=Han}/gu) ?? [] : [title];
};
