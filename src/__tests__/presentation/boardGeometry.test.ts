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
        ["src/presentation/pages/game-review/GameReview.vue", "review-board"],
        ["src/presentation/pages/solver-walkthrough/SolverWalkthrough.vue", "walkthrough-board"],
    ])("%s gives its board more of the screen width than the page gutter", (path, testId) => {
        // The page keeps its 20px gutter for everything else; every board reaches 8px from the edge,
        // so the board is the same width in the game, the review and the walkthrough
        expect(boardTagOf(path, testId)).toMatch(/class="[^"]*\B-mx-3\b/);
        expect(boardTagOf(path, testId)).not.toMatch(/class="[^"]*\bw-full\b/);
    });

    it("should widen the game board the same way, but no further than a short screen allows", () => {
        // Centred and 24px wider than the page's content, like the other boards; on a short screen
        // (360×640) it gives up width so the digit keys stay on screen
        const boardTag = boardTagOf("src/presentation/pages/game/GameScreen.vue", "game-board");
        expect(boardTag).toMatch(/class="[^"]*\bself-center\b/);
        expect(boardTag).toMatch(/class="[^"]*\bw-\[calc\(100%\+1\.5rem\)\]/);
        expect(boardTag).toMatch(/class="[^"]*\bmax-w-board-fit\b/);

        const utility = /@utility max-w-board-fit \{([^}]*)\}/.exec(readFileSync("src/style/index.css", "utf8"))?.[1] ?? "";
        // A short but wide window (a phone in landscape, split screen) keeps a usable board and scrolls
        expect(utility).toMatch(/max-width: max\(17rem, calc\(100dvh - /);
        expect(utility).toContain("safe-area-inset-top");
        expect(utility).toContain("safe-area-inset-bottom");
    });
});
