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
});
