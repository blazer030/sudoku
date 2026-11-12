import { readFileSync } from "fs";
import { mount } from "@vue/test-utils";
import BoardCell from "@/presentation/components/board-cell/BoardCell.vue";

// Every page draws its board through SudokuBoard, whose rows come from a v-for over rows
const SUDOKU_BOARD = "src/presentation/components/sudoku-board/SudokuBoard.vue";

const tagsOf = (path: string): string[] =>
    [...readFileSync(path, "utf8").matchAll(/<\w+\b(?:[^>"']|"[^"]*"|'[^']*')*>/g)].map(([tag]) => tag);

const rowTag = (): string => {
    const row = tagsOf(SUDOKU_BOARD).find(tag => tag.includes('v-for="(row, rowIndex)'));
    if (row === undefined) throw new Error("SudokuBoard has no board row");
    return row;
};

describe("board geometry", () => {
    it("lays each row out as nine equal columns", () => {
        // Equal grid tracks keep every cell the same width whatever its border, so square cells stay square
        expect(rowTag()).toMatch(/class="[^"]*\bgrid grid-cols-9\b/);
    });

    it("should size a cell by its grid column, not by flexing around its borders", () => {
        const wrapper = mount(BoardCell, { props: { row: 0, column: 2, value: 0 } });

        expect(wrapper.classes()).not.toContain("flex-1");
        expect(wrapper.classes()).toContain("aspect-square");
    });

    const boardTagOf = (path: string, testId: string): string =>
        tagsOf(path).find(tag => tag.includes(`data-testid="${testId}"`)) ?? "";

    it("widens the board past the page gutter, but no further than a short screen allows", () => {
        // Centred and 24px wider than the page's content, so it reaches 8px from the screen edges
        const boardTag = tagsOf(SUDOKU_BOARD).find(tag => tag.includes('data-skin="board"')) ?? "";
        expect(boardTag).toMatch(/class="[^"]*\bself-center\b/);
        expect(boardTag).toMatch(/class="[^"]*\bw-\[calc\(100%\+1\.5rem\)\]/);
        expect(boardTag).toMatch(/class="[^"]*\bmax-w-board-fit\b/);
    });

    it.each([
        ["src/presentation/pages/game/GameScreen.vue", "game-board"],
        ["src/presentation/pages/game-review/GameReview.vue", "review-board"],
        ["src/presentation/pages/solver-walkthrough/SolverWalkthrough.vue", "walkthrough-board"],
        ["src/presentation/pages/lessons/LessonScreen.vue", "lesson-board"],
    ])("%s draws that board, with no width of its own", (path, testId) => {
        const boardTag = boardTagOf(path, testId);
        expect(boardTag).toMatch(/^<SudokuBoard\b/);
        expect(boardTag).not.toMatch(/class="[^"]*\b(?:w-full|-mx-3|w-\[|max-w-)/);
    });

    it("should cap the boards by the screen's height, with a floor for short but wide windows", () => {
        const utility = /@utility max-w-board-fit \{([^}]*)\}/.exec(readFileSync("src/style/index.css", "utf8"))?.[1] ?? "";
        // A short but wide window (a phone in landscape, split screen) keeps a usable board and scrolls
        // 15rem (240px) still fits a 640px phone whose status and navigation bars take 72px
        expect(utility).toMatch(/max-width: (?:calc\()?max\(15rem, calc\(100dvh - /);
        expect(utility).toContain("safe-area-inset-top");
        expect(utility).toContain("safe-area-inset-bottom");
    });

    describe("what shrinks round the board on a short window", () => {
        const indexCss = readFileSync("src/style/index.css", "utf8");
        const size = (token: string): { smallest: number; share: number } => {
            const match = new RegExp(`--${token}: calc\\(([\\d.]+)px \\+ ([\\d.]+) \\* var\\(--game-step\\)\\);`).exec(indexCss);
            if (match === null) throw new Error(`--${token} is not a size on --game-step`);
            return { smallest: Number(match[1]), share: Number(match[2]) };
        };
        const HEADER = 28;
        // Each part of the game screen besides the board, as often as it appears from top to bottom
        const PARTS: [token: string, times: number][] = [
            ["game-page-top", 1],
            ["game-page-gap", 3],
            ["game-section-gap", 2],
            ["game-control-size", 1],
            ["game-control-label-gap", 1],
            ["game-control-label-text", 1],
            ["digit-key-size", 2],
            ["digit-key-row-gap", 1],
            ["game-page-bottom", 1],
        ];
        const total = (read: (part: { smallest: number; share: number }) => number): number =>
            PARTS.reduce((sum, [token, times]) => sum + times * read(size(token)), 0);

        it("should leave the board the room those parts do not take, at every size", () => {
            const room = size("board-room");

            expect(total(part => part.smallest) + HEADER).toBe(room.smallest);
            expect(total(part => part.share)).toBe(room.share);
            // At full size the screen is as it always was
            expect(room.smallest + room.share).toBe(331);
        });

        it("should give back exactly the room the sizes have to give", () => {
            const room = size("board-room");
            const step = /--game-step: max\(calc\(clamp\(0px, max\(.* - ([\d.]+)px, .* - ([\d.]+)px\), ([\d.]+)px\) \/ ([\d.]+)\),/.exec(indexCss);

            expect(Number(step?.[1])).toBe(room.smallest);
            expect(Number(step?.[3])).toBe(room.share);
            expect(Number(step?.[4])).toBe(room.share);
            // Full size from a 720px window up
            expect(Number(step?.[2]) + room.share).toBe(720);
        });

        it("should leave a window wider than the column at full size, however short: a tablet or a laptop, not a small screen", () => {
            expect(indexCss).toContain("--wider-than-column: clamp(0px, 100vw - 640px, 1px);");
            expect(indexCss).toMatch(/--game-step: max\(.*, var\(--wider-than-column\)\);/);
        });

        it("should keep a digit's share of its key as the key shrinks", () => {
            const key = size("digit-key-size");
            for (const token of ["digit-key-text", "digit-key-note-text"]) {
                const text = size(token);
                expect(text.smallest / key.smallest).toBeCloseTo((text.smallest + text.share) / (key.smallest + key.share));
            }
        });

    });

    describe("Game Review's board, the same size as the game's", () => {
        const indexCss = readFileSync("src/style/index.css", "utf8");
        const reviewPage = readFileSync("src/presentation/pages/game-review/GameReview.vue", "utf8");
        const size = (token: string): { smallest: number; share: number } => {
            const match = new RegExp(`--${token}: calc\\(([\\d.]+)px \\+ ([\\d.]+) \\* var\\(--review-step\\)\\);`).exec(indexCss);
            if (match === null) throw new Error(`--${token} is not a size on --review-step`);
            return { smallest: Number(match[1]), share: Number(match[2]) };
        };
        // Each part of the page besides the board, from top to bottom, with how often it appears and what it was
        // before it could shrink
        const PARTS: [token: string, times: number, fullSize: number][] = [
            ["review-page-top", 1, 24],
            ["review-header-bottom", 1, 4],
            ["review-page-gap", 4, 16],
            ["review-card-padding", 2, 8],
            ["review-section-gap", 1, 24],
            ["step-panel-top", 1, 16],
            ["step-panel-row", 1, 32],
            ["step-panel-gap", 2, 12],
            ["step-panel-control", 1, 44],
            ["step-panel-bottom", 1, 12],
            ["review-page-bottom", 1, 24],
        ];
        // What cannot shrink: the header's title, the summary card's two lines and the explanation's one
        const FIXED = 28 + 42.5 + 23.2;
        const sum = (read: (part: { smallest: number; share: number }, fullSize: number) => number): number =>
            PARTS.reduce((total, [token, times, fullSize]) => total + times * read(size(token), fullSize), 0);

        it("should take the game's room, not a smaller board of its own", () => {
            expect(reviewPage).not.toContain("--board-room");
        });

        it("should fit the game's smallest room, so a short window needs no scrolling", () => {
            const gameRoom = Number(/--board-room: calc\(([\d.]+)px/.exec(indexCss)?.[1]);

            expect(sum(part => part.smallest) + FIXED).toBeLessThanOrEqual(gameRoom);
        });

        it("should stay as it always was on a window with room for it all", () => {
            PARTS.forEach(([token, , fullSize]) => {
                const part = size(token);
                expect(part.smallest + part.share, token).toBe(fullSize);
            });
        });

        it("should give back exactly the room the sizes have to give", () => {
            const step = /--review-step: max\(calc\(clamp\(0px, .* - ([\d.]+)px, ([\d.]+)px\) \/ ([\d.]+)\),/.exec(indexCss);
            const shares = sum(part => part.share);

            expect(Number(step?.[2])).toBe(shares);
            expect(Number(step?.[3])).toBe(shares);
            // It starts to grow only once the parts' smallest sizes fit
            expect(Number(step?.[1])).toBeGreaterThanOrEqual(sum(part => part.smallest) + FIXED);
        });

        it("should leave a window 720px tall or more alone, even one too wide for its board to leave room for it all", () => {
            const fullSizeFrom = /--review-step: max\(.*, clamp\(0px, var\(--usable-height\) - ([\d.]+)px, 1px\), var\(--wider-than-column\)\);/.exec(indexCss);

            expect(Number(fullSizeFrom?.[1]) + 1).toBe(720);
        });

        it("should leave the Walkthrough's panel, which it shares, as it is", () => {
            expect(reviewPage).toContain("review-sizes");
            expect(readFileSync("src/presentation/pages/solver-walkthrough/SolverWalkthrough.vue", "utf8")).not.toContain("review-sizes");

            const panel = readFileSync("src/presentation/components/step-presentation/StepPlaybackPanel.vue", "utf8");
            expect(panel).toContain("pt-[var(--step-panel-top,1rem)]");
            expect(panel).toContain("pb-[var(--step-panel-bottom,0.75rem)]");
            expect(panel).toContain("gap-[var(--step-panel-gap,0.75rem)]");
            expect(panel).toContain("min-h-[var(--step-panel-row,2rem)]");
            expect(panel).toContain("size-[var(--step-panel-control,2.75rem)]");
        });
    });

    it("should shrink the boards by the height a style's board frame adds, so the digit keys stay on a short screen", () => {
        const utility = /@utility max-w-board-fit \{([^}]*)\}/.exec(readFileSync("src/style/index.css", "utf8"))?.[1] ?? "";
        // A frame sets --board-frame-block on its own element; the board inside it, being square, gives up that much width
        expect(utility).toContain("- var(--board-frame-block, 0px)");
    });

    it("should let a style's board frame, which carries the board's width, grow by the width it adds round the board", () => {
        const utility = /@utility max-w-board-fit \{([^}]*)\}/.exec(readFileSync("src/style/index.css", "utf8"))?.[1] ?? "";
        // A frame sets --board-frame-inline on its own element, so the board it holds keeps the size the height allows
        expect(utility).toMatch(/max-width: calc\(max\(15rem, calc\(100dvh - .*\) \+ var\(--board-frame-inline, 0px\)\);/);
    });
});
