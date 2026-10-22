/** How a style draws its thumbnail in Settings, as plain token classes over the thumbnail's own palette. */
export interface ThumbnailLook {
    /** The style's interface face, pinned on the thumbnail so the active style's never leaks in */
    sansFont: string;
    page: string;
    board: string;
    /** Added to every cell; the fill comes from the cell's role */
    cell: string;
    /** Added to the selected cell's fill */
    selected: string;
    given: string;
    entered: string;
    circledSelection: boolean;
    key: string;
    keyDigit: string;
    pill: string;
}
