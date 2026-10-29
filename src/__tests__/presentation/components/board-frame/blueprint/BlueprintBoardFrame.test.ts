import { readFileSync } from "fs";
import postcss from "postcss";
import { afterEach, describe, expect, it } from "vitest";
import { h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import BlueprintBoardFrame from "@/presentation/components/board-frame/blueprint/BlueprintBoardFrame.vue";
import { STYLE_BOARD_FRAMES } from "@/presentation/components/board-frame/boardFrames";
import type { BoardFrameProps } from "@/presentation/components/board-frame/boardFrames";
import type { CompletedGroup } from "@/domain/game/Sudoku";

const SOURCE = readFileSync("src/presentation/components/board-frame/blueprint/BlueprintBoardFrame.vue", "utf8");
const STYLE_BLOCK = /<style scoped>([\s\S]*?)<\/style>/.exec(SOURCE)?.[1] ?? "";

// The declarations of the component's scoped rule for exactly this selector
const declarationsOf = (selector: string): Map<string, string> => {
    const declarations = new Map<string, string>();
    postcss.parse(STYLE_BLOCK).walkRules((rule) => {
        if (!rule.selectors.includes(selector)) return;
        rule.walkDecls((declaration) => { declarations.set(declaration.prop, declaration.value.trim()); });
    });
    return declarations;
};

const ANY_OVERFLOW_HIDDEN = /overflow(?:-[xy])?\s*:\s*(?:hidden|clip)/;

const mountFrame = (target: BoardFrameProps["target"]) => mount(BlueprintBoardFrame, {
    props: { target, effect: null, celebration: null },
    slots: { default: () => h("div", { "data-skin": "board", "data-testid": "framed-board" }) },
});

const percentOf = (element: Element, property: "left" | "top"): number =>
    Number.parseFloat((element as HTMLElement).style[property]);

describe("BlueprintBoardFrame", () => {
    afterEach(() => {
        i18n.global.locale.value = "en";
    });

    it("should be blueprint's board frame", () => {
        expect(STYLE_BOARD_FRAMES.blueprint).toBe(BlueprintBoardFrame);
    });

    it("should wrap the board it is given", () => {
        const wrapper = mountFrame(null);

        expect(wrapper.get(".blueprint-frame").find("[data-testid='framed-board']").exists()).toBe(true);
    });

    it("should label the columns C1–C9 and the rows R1–R9, a dimension line and four registration crosses, in one decorative layer", () => {
        const wrapper = mountFrame(null);
        const marks = wrapper.get(".blueprint-frame-marks");

        const columns = marks.findAll(".blueprint-frame-label[data-axis='column']");
        const rows = marks.findAll(".blueprint-frame-label[data-axis='row']");
        expect(columns.map(label => label.text())).toEqual(["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9"]);
        expect(columns.map(label => label.attributes("data-index"))).toEqual(["0", "1", "2", "3", "4", "5", "6", "7", "8"]);
        expect(rows.map(label => label.text())).toEqual(["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9"]);
        expect(rows.map(label => label.attributes("data-index"))).toEqual(["0", "1", "2", "3", "4", "5", "6", "7", "8"]);
        expect(marks.findAll(".blueprint-frame-dimension")).toHaveLength(1);
        expect(marks.findAll(".blueprint-frame-register")).toHaveLength(4);
        expect(marks.attributes("aria-hidden")).toBe("true");
        expect(declarationsOf(".blueprint-frame-marks").get("pointer-events")).toBe("none");
    });

    it("should write the dimension line's nine columns in the current language", async () => {
        const wrapper = mountFrame(null);
        const dimension = wrapper.get(".blueprint-frame-dimension");
        const english = dimension.text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(english).toContain("9");
        expect(dimension.text()).toContain("9");
        expect(dimension.text()).not.toBe(english);
    });

    it("should pad round the board for its marks, less the board's own 8px padding, and give up that height", () => {
        const frame = declarationsOf(".blueprint-frame");

        expect(frame.get("padding")).toBe("10px 4px 16px 14px");
        expect(frame.get("--board-frame-block")).toBe("26px");
        expect(frame.get("--board-frame-inline")).toBe("18px");
    });

    it("should take the board's place and width in the page, the board filling it", () => {
        const wrapper = mountFrame(null);
        const frame = declarationsOf(".blueprint-frame");
        const board = declarationsOf(':slotted([data-skin~="board"])');

        expect(wrapper.get(".blueprint-frame").classes()).toContain("max-w-board-fit");
        expect(frame.get("align-self")).toBe("center");
        expect(frame.get("width")).toBe("calc(100% + 1.5rem)");
        expect(board.get("width")).toBe("100%");
        expect(board.get("--board-frame-inline")).toBe("0px");
    });

    it("should tag the target cell by name in its column's label place, and light its row's label", () => {
        const wrapper = mountFrame({ row: 4, column: 4 });
        const callout = wrapper.get(".blueprint-frame-marks .blueprint-frame-grid > .blueprint-callout");

        expect(callout.get(".blueprint-callout-text").text()).toBe("R5C5");
        expect(percentOf(callout.element, "left")).toBeCloseTo(4.5 * 100 / 9, 3);
        expect(wrapper.findAll("[data-axis='column'][data-target]").map(label => label.attributes("data-index"))).toEqual(["4"]);
        expect(wrapper.findAll("[data-axis='row'][data-target]").map(label => label.attributes("data-index"))).toEqual(["4"]);
    });

    it("should back each label in the paper, tight to its glyphs, so no graph-paper line runs under it", () => {
        const label = declarationsOf(".blueprint-frame-label");

        expect(label.get("background-color")).toBe("var(--color-background)");
        // Grid items stretch to their track: these keep the backing to the label's own width
        expect(declarationsOf('.blueprint-frame-label[data-axis="column"]').get("justify-self")).toBe("center");
        expect(declarationsOf('.blueprint-frame-label[data-axis="row"]').get("justify-self")).toBe("end");
    });

    it("should hide the target column's label under the tag and colour the target row's label", () => {
        expect(declarationsOf('.blueprint-frame-label[data-axis="column"][data-target]').get("visibility")).toBe("hidden");
        expect(declarationsOf('.blueprint-frame-label[data-axis="row"][data-target]').get("color")).toBe("var(--color-primary)");
        const text = declarationsOf(".blueprint-callout-text");
        expect(text.get("background")).toBe("var(--color-primary)");
        expect(text.get("color")).toBe("var(--color-on-primary)");
        expect(text.get("font-size")).toBe("11px");
        expect(text.get("font-weight")).toBe("600");
    });

    it("should keep the tag and its leader in the frame's top margin, clear of the cells", () => {
        const callout = declarationsOf(".blueprint-callout");
        const leader = declarationsOf(".blueprint-callout::after");

        // The tag sits where the column labels do, 8px above the cells; the leader stops at the board grid's
        // 3px top border, so neither ever lies over a cell
        expect(callout.get("bottom")).toBe("calc(100% + 8px)");
        expect(leader.get("top")).toBe("100%");
        expect(leader.get("height")).toBe("5px");
    });

    it("should lay the tag over the corner registration crosses it meets on C1 and C9", () => {
        // The crosses sit later in the marks layer with no z-index; the grid holding the tag sets none either,
        // so the tag's own z-index lifts it over them
        expect(declarationsOf(".blueprint-frame-register").has("z-index")).toBe(false);
        expect(declarationsOf(".blueprint-frame-grid").has("z-index")).toBe(false);
        expect(Number(declarationsOf(".blueprint-callout").get("z-index"))).toBeGreaterThan(0);
    });

    it("should call out nothing and light no label without a target", () => {
        const wrapper = mountFrame(null);

        expect(wrapper.find(".blueprint-callout").exists()).toBe(false);
        expect(wrapper.findAll("[data-target]")).toHaveLength(0);
    });

    it.each([
        { name: "R1C1", target: { row: 0, column: 0 } },
        { name: "R1C9", target: { row: 0, column: 8 } },
        { name: "R9C1", target: { row: 8, column: 0 } },
        { name: "R9C9", target: { row: 8, column: 8 } },
    ])("should tag $name above its column, whatever its row", ({ name, target }) => {
        const wrapper = mountFrame(target);
        const callout = wrapper.get(".blueprint-callout");

        expect(callout.text()).toBe(name);
        expect(percentOf(callout.element, "left")).toBeCloseTo((target.column + 0.5) * 100 / 9, 3);
        expect((callout.element as HTMLElement).style.top).toBe("");
        expect(wrapper.get(`[data-axis='row'][data-index='${target.row}']`).attributes("data-target")).toBeDefined();
    });

    it("should let a corner cell's callout reach past the frame, nothing round it clipping", () => {
        const wrapper = mountFrame({ row: 0, column: 0 });
        const callout = wrapper.get(".blueprint-callout").element;
        const frame = wrapper.get(".blueprint-frame").element;

        const clipping: string[] = [];
        for (let element: Element | null = callout; element !== null && element !== frame.parentElement; element = element.parentElement) {
            if (element.classList.contains("overflow-hidden") || element.classList.contains("overflow-clip")) clipping.push(element.className);
        }
        expect(clipping).toEqual([]);
        expect(STYLE_BLOCK).not.toMatch(ANY_OVERFLOW_HIDDEN);
    });

    describe("completed groups", () => {
        const mountWithEffect = (groups: CompletedGroup[]) => mount(BlueprintBoardFrame, {
            props: { target: null, effect: { id: 1, groups, origin: { row: 4, column: 4 } }, celebration: null },
        });
        const litLabels = (wrapper: ReturnType<typeof mountWithEffect>): string[] =>
            wrapper.findAll("[data-lit]").map(label => label.text());

        it("should light a completed row's label", () => {
            expect(litLabels(mountWithEffect([{ kind: "row", index: 4 }]))).toEqual(["R5"]);
        });

        it("should light a completed column's label", () => {
            expect(litLabels(mountWithEffect([{ kind: "column", index: 4 }]))).toEqual(["C5"]);
        });

        // Ruling 9: a box has no label of its own beside the board, and lights none of its rows' or columns'
        it("should light no label for a completed box", () => {
            expect(litLabels(mountWithEffect([{ kind: "box", index: 4 }]))).toEqual([]);
        });

        it("should light each completed line's label together", () => {
            const groups: CompletedGroup[] = [{ kind: "row", index: 1 }, { kind: "box", index: 1 }, { kind: "column", index: 7 }];

            expect(litLabels(mountWithEffect(groups))).toEqual(["C8", "R2"]);
        });

        it("should light no label without an effect", () => {
            expect(mountFrame({ row: 4, column: 4 }).findAll("[data-lit]")).toHaveLength(0);
        });
    });

    // Ruling 11: the frame, which has room round the board, draws the solved board's lock and its verdict
    describe("the solved board", () => {
        const mountSolved = (celebration: BoardFrameProps["celebration"]) => mount(BlueprintBoardFrame, {
            props: { target: null, effect: null, celebration },
        });

        it.each(["playing", "done", "still"] as const)("should lock the whole board in a dashed frame with its verdict while %s", (celebration) => {
            const wrapper = mountSolved(celebration);
            const grid = wrapper.get(".blueprint-frame-marks .blueprint-frame-grid");
            const lock = grid.get(".blueprint-frame-lock");

            expect(lock.element.tagName.toLowerCase()).toBe("svg");
            expect(lock.get("rect").attributes("stroke-dasharray")).toBe("6 4");
            // Inset by half its stroke, as the canvas's, so the whole line lies on the lock's box
            expect(lock.get("rect").attributes("x")).toBe("0.75");
            expect(lock.get("rect").attributes("y")).toBe("0.75");
            expect(lock.get("rect").attributes("width")).toBe("calc(100% - 1.5px)");
            expect(lock.get("rect").attributes("height")).toBe("calc(100% - 1.5px)");
            expect(lock.get("rect").attributes("stroke")).toBe("currentColor");
            expect(grid.get(".blueprint-frame-verdict").text()).toBe("R1–R9 · C1–C9 OK");
        });

        it("should write the verdict alike in both languages", async () => {
            const wrapper = mountSolved("playing");
            const english = wrapper.get(".blueprint-frame-verdict").text();

            i18n.global.locale.value = "zh-Hant";
            await nextTick();

            expect(wrapper.get(".blueprint-frame-verdict").text()).toBe(english);
        });

        it("should mark the lock and the verdict still on a still board, and only there", () => {
            const still = mountSolved("still");
            const moving = mountSolved("playing");

            expect(still.get(".blueprint-frame-lock").attributes("data-still")).toBeDefined();
            expect(still.get(".blueprint-frame-verdict").attributes("data-still")).toBeDefined();
            expect(moving.get(".blueprint-frame-lock").attributes("data-still")).toBeUndefined();
            expect(moving.get(".blueprint-frame-verdict").attributes("data-still")).toBeUndefined();
        });

        it("should draw neither before the board is solved", () => {
            const wrapper = mountSolved(null);

            expect(wrapper.find(".blueprint-frame-lock").exists()).toBe(false);
            expect(wrapper.find(".blueprint-frame-verdict").exists()).toBe(false);
        });

        it("should keep the same lock from the board phase to the dialog, so its dashes march on", async () => {
            const wrapper = mountSolved("playing");
            const lock = wrapper.get(".blueprint-frame-lock").element;

            await wrapper.setProps({ celebration: "done" });

            expect(wrapper.get(".blueprint-frame-lock").element).toBe(lock);
        });

        // The canvas's .aframe: 9px round the cells; its verdict hangs from its top right corner
        it("should lay the lock 9px round the cells and hang the verdict from its top right corner", () => {
            expect(declarationsOf(".blueprint-frame-lock").get("inset")).toBe("-9px");
            expect(declarationsOf(".blueprint-frame-lock").get("overflow")).toBe("visible");
            const verdict = declarationsOf(".blueprint-frame-verdict");
            expect(verdict.get("top")).toBe("-9px");
            expect(verdict.get("right")).toBe("-6px");
            const leader = declarationsOf(".blueprint-frame-verdict::before");
            expect(leader.get("width")).toBe("34px");
            expect(leader.get("transform")).toBe("rotate(-140deg)");
            const text = declarationsOf(".blueprint-frame-verdict-text");
            expect(text.get("background")).toBe("var(--color-primary)");
            expect(text.get("color")).toBe("var(--color-on-primary)");
        });
    });

    it("should move the callout to a new target without remounting the frame", async () => {
        const wrapper = mountFrame({ row: 4, column: 4 });
        const frame = wrapper.get(".blueprint-frame").element;
        const board = wrapper.get("[data-testid='framed-board']").element;
        const callout = wrapper.get(".blueprint-callout").element;

        await wrapper.setProps({ target: { row: 1, column: 7 } });

        expect(wrapper.get(".blueprint-frame").element).toBe(frame);
        expect(wrapper.get("[data-testid='framed-board']").element).toBe(board);
        expect(wrapper.get(".blueprint-callout").element).toBe(callout);
        expect(wrapper.get(".blueprint-callout-text").text()).toBe("R2C8");
        expect(percentOf(callout, "left")).toBeCloseTo(7.5 * 100 / 9, 3);
        expect(wrapper.findAll("[data-target]").map(label => `${label.attributes("data-axis")} ${label.attributes("data-index")}`)).toEqual(["column 7", "row 1"]);
    });
});
