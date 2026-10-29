import { readFileSync } from "fs";
import postcss from "postcss";
import { afterEach, describe, expect, it } from "vitest";
import { h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import BlueprintBoardFrame from "@/presentation/components/board-frame/blueprint/BlueprintBoardFrame.vue";
import { STYLE_BOARD_FRAMES } from "@/presentation/components/board-frame/boardFrames";
import type { BoardFrameProps } from "@/presentation/components/board-frame/boardFrames";

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

    it("should be blueprint's board frame, and the only one", () => {
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

    it("should call out the target cell by name, pulling right", () => {
        const callout = mountFrame({ row: 4, column: 4 }).get(".blueprint-frame-marks .blueprint-callout");

        expect(callout.get(".blueprint-callout-text").text()).toBe("R5C5");
        expect(callout.attributes("data-direction")).toBe("right");
    });

    it.each([6, 7, 8])("should pull the callout left in column index %i", (column) => {
        const callout = mountFrame({ row: 2, column }).get(".blueprint-callout");

        expect(callout.attributes("data-direction")).toBe("left");
    });

    it("should call out nothing without a target", () => {
        expect(mountFrame(null).find(".blueprint-callout").exists()).toBe(false);
    });

    it.each([
        { name: "R1C1", target: { row: 0, column: 0 }, left: 100 / 9, top: 0 },
        { name: "R1C9", target: { row: 0, column: 8 }, left: 800 / 9, top: 0 },
        { name: "R9C1", target: { row: 8, column: 0 }, left: 100 / 9, top: 800 / 9 },
        { name: "R9C9", target: { row: 8, column: 8 }, left: 800 / 9, top: 800 / 9 },
    ])("should pin $name's callout to its top outer corner, by the cell's place on the grid", ({ name, target, left, top }) => {
        const callout = mountFrame(target).get(".blueprint-callout");

        expect(callout.text()).toBe(name);
        expect(percentOf(callout.element, "left")).toBeCloseTo(left, 3);
        expect(percentOf(callout.element, "top")).toBeCloseTo(top, 3);
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
        expect(wrapper.get(".blueprint-callout").attributes("data-direction")).toBe("left");
    });
});
