import { readFileSync } from "fs";
import { AURORA_WINDOWS } from "./auroraWindows";

// The board's width follows max-w-board-fit: the window's height less what the header and the keypad take, capped by
// the app's 640px column less its 8px side padding, less the board's own 11px inset each side for the cells. What they
// take shrinks on a short window, by --game-step in the sheet. The board's top sits under the page's top padding, the
// header and two gaps, centred in what is left. A layout change that moves the board breaks this, so the measured
// windows the contrast model samples are re-measured with it.
const INDEX_CSS = readFileSync("src/style/index.css", "utf8");
const SMALLEST_ROOM = Number(/--board-room: calc\((\d+)px/.exec(INDEX_CSS)?.[1]);
const ROOM_SHARE = Number(/--board-room: calc\(\d+px \+ (\d+) \*/.exec(INDEX_CSS)?.[1]);
const COLUMN = 640;
const PAGE_PADDING = 8;
const BOARD_INSET = 11;
const HEADER_ROW = 28;
const FULL_SIZE_WINDOW = 720;

const expectedBoard = (width: number, height: number): [number, number, number] => {
    const widest = Math.min(width, COLUMN) - 2 * PAGE_PADDING;
    const giveBack = width > COLUMN ? ROOM_SHARE : Math.max(0, Math.min(ROOM_SHARE, Math.max(height - widest - SMALLEST_ROOM, height - FULL_SIZE_WINDOW + ROOM_SHARE)));
    const step = giveBack / ROOM_SHARE;
    const room = SMALLEST_ROOM + giveBack;
    const cells = Math.min(widest, height - room) - 2 * BOARD_INSET;
    const above = 8 + 16 * step + HEADER_ROW + 2 * (4 + 4 * step) + BOARD_INSET;
    return [(width - cells) / 2, above + Math.max(0, (height - cells - room - 2 * BOARD_INSET) / 2), cells];
};

describe("aurora's measured windows", () => {
    it("should read the keypad's room from the sheet", () => {
        expect(SMALLEST_ROOM + ROOM_SHARE).toBe(331);
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
