// The windows aurora's sky is sampled in (phones, tablets and a landscape window), and where the game's board lies in each: the cells' outer edges in CSS px
// (left, top, right, bottom), measured in the app. To re-measure after a layout change, start the dev server, open a
// new game in each window size and read the bounding rects of [data-testid="cell-0-0"] (left, top) and
// [data-testid="cell-8-8"] (right, bottom).
export interface AuroraWindow {
    width: number;
    height: number;
    board: readonly [left: number, top: number, right: number, bottom: number];
}

export const AURORA_WINDOWS: readonly AuroraWindow[] = [
    { width: 390, height: 844, board: [19, 149, 371, 501] },
    { width: 360, height: 640, board: [37, 79, 324, 366] },
    // iPhone SE, a 7-inch tablet, an iPad upright and on its side
    { width: 375, height: 667, board: [31, 79, 345, 393] },
    { width: 600, height: 960, board: [19, 101, 581, 664] },
    { width: 768, height: 1024, board: [83, 114, 685, 716] },
    { width: 1024, height: 768, board: [305, 79, 719, 494] },
];
