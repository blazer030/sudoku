import { readFileSync } from "fs";
import { mount } from "@vue/test-utils";
import BoardCell from "@/presentation/components/board-cell/BoardCell.vue";

// Every board draws its rows from a v-for over rows; the row element is the tag that holds it
const BOARDS = [
    "src/presentation/pages/game/GameScreen.vue",
    "src/presentation/pages/game-review/GameReview.vue",
    "src/presentation/pages/solver-walkthrough/SolverWalkthrough.vue",
];

const rowTag = (path: string): string => {
    const source = readFileSync(path, "utf8");
    const tags = [...source.matchAll(/<\w+\b(?:[^>"']|"[^"]*"|'[^']*')*>/g)].map(([tag]) => tag);
    const row = tags.find(tag => tag.includes('v-for="(row, rowIndex)'));
    if (row === undefined) throw new Error(`${path} has no board row`);
    return row;
};

describe("board geometry", () => {
    it.each(BOARDS)("%s lays each row out as nine equal columns", (path) => {
        // Equal grid tracks keep every cell the same width whatever its border, so square cells stay square
        expect(rowTag(path)).toMatch(/class="[^"]*\bgrid grid-cols-9\b/);
    });

    it("should size a cell by its grid column, not by flexing around its borders", () => {
        const wrapper = mount(BoardCell, { props: { row: 0, column: 2, value: 0 } });

        expect(wrapper.classes()).not.toContain("flex-1");
        expect(wrapper.classes()).toContain("aspect-square");
    });

    const boardTagOf = (path: string, testId: string): string =>
        [...readFileSync(path, "utf8").matchAll(/<\w+\b(?:[^>"']|"[^"]*"|'[^']*')*>/g)].map(([tag]) => tag)
            .find(tag => tag.includes(`data-testid="${testId}"`)) ?? "";

    it.each([
        ["src/presentation/pages/game/GameScreen.vue", "game-board"],
        ["src/presentation/pages/game-review/GameReview.vue", "review-board"],
        ["src/presentation/pages/solver-walkthrough/SolverWalkthrough.vue", "walkthrough-board"],
    ])("%s widens its board past the page gutter, but no further than a short screen allows", (path, testId) => {
        // Centred and 24px wider than the page's content, so it reaches 8px from the screen edges
        const boardTag = boardTagOf(path, testId);
        expect(boardTag).toMatch(/class="[^"]*\bself-center\b/);
        expect(boardTag).toMatch(/class="[^"]*\bw-\[calc\(100%\+1\.5rem\)\]/);
        expect(boardTag).toMatch(/class="[^"]*\bmax-w-board-fit\b/);
        expect(boardTag).not.toMatch(/class="[^"]*\b(?:w-full|-mx-3)\b/);
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
            const step = /--game-step: calc\(clamp\(0px, max\(.* - ([\d.]+)px, .* - ([\d.]+)px\), ([\d.]+)px\) \/ ([\d.]+)\);/.exec(indexCss);

            expect(Number(step?.[1])).toBe(room.smallest);
            expect(Number(step?.[3])).toBe(room.share);
            expect(Number(step?.[4])).toBe(room.share);
            // Full size from a 720px window up
            expect(Number(step?.[2]) + room.share).toBe(720);
        });

        it("should keep a digit's share of its key as the key shrinks", () => {
            const key = size("digit-key-size");
            for (const token of ["digit-key-text", "digit-key-note-text"]) {
                const text = size(token);
                expect(text.smallest / key.smallest).toBeCloseTo((text.smallest + text.share) / (key.smallest + key.share));
            }
        });

        it("should keep Game Review's board at the room it always had, as it has no keys to shrink", () => {
            expect(readFileSync("src/presentation/pages/game-review/GameReview.vue", "utf8")).toContain("[--board-room:331px]");
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
