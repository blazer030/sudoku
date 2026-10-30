import { readFileSync } from "fs";
import { AURORA_WINDOWS } from "./auroraWindows";

// The board's width follows max-w-board-fit: the window's height less what the header and the keypad take, capped by
// the app's 640px column less its 8px side padding, less the board's own 11px inset each side for the cells. Its top
// sits under the 79px header, centred in what the keypad leaves (the measured 354px). A layout change that moves the
// board breaks this, so the measured windows the contrast model samples are re-measured with it.
const INDEX_CSS = readFileSync("src/style/index.css", "utf8");
const KEYPAD_ROOM = Number(/@utility max-w-board-fit \{\s*max-width: calc\(max\(15rem, calc\(100dvh - (\d+)px/.exec(INDEX_CSS)?.[1]);
const COLUMN = 640;
const PAGE_PADDING = 8;
const BOARD_INSET = 11;
const HEADER = 79;
const LOWER_ROOM = 354;

const expectedBoard = (width: number, height: number): [number, number, number] => {
    const cells = Math.min(Math.min(width, COLUMN) - 2 * PAGE_PADDING, height - KEYPAD_ROOM) - 2 * BOARD_INSET;
    return [(width - cells) / 2, HEADER + Math.max(0, (height - cells - LOWER_ROOM) / 2), cells];
};

describe("aurora's measured windows", () => {
    it("should read the keypad's room from max-w-board-fit", () => {
        expect(KEYPAD_ROOM).toBe(331);
    });

    it.each(AURORA_WINDOWS.map(window => [window.width, window.height, window] as const))(
        "should place the %ix%i window's board where max-w-board-fit lays it, to the pixel",
        (width, height, { board: [left, top, right] }) => {
            const [expectedLeft, expectedTop, cells] = expectedBoard(width, height);

            expect(Math.abs(right - left - cells)).toBeLessThanOrEqual(1);
            expect(Math.abs(left - expectedLeft)).toBeLessThanOrEqual(1);
            expect(Math.abs(top - expectedTop)).toBeLessThanOrEqual(1);
        },
    );
});
