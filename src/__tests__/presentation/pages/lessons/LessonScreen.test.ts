import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import type { Lesson, LessonBoard } from "@/domain/lessons/Lesson";
import LessonScreen from "@/presentation/pages/lessons/LessonScreen.vue";
import { useSettingsStore } from "@/stores/settingsStore";
import { i18n } from "@/presentation/i18n";

/*
 . . .  2 6 .  7 . 1
 6 8 .  . 7 .  . 9 .
 1 9 .  . . 4  5 . .
*/
const BOARD: LessonBoard = {
    values: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
    showsCandidates: false,
};
const cell = (row: number, column: number) => ({ row, column });

const LESSON: Lesson = {
    id: "hiddenSingle",
    steps: [
        { kind: "show", stage: "explain", board: BOARD, marks: {}, textKey: "lessons.names.rules" },
        { kind: "show", stage: "explain", board: BOARD, marks: { crossed: [cell(0, 0)] }, textKey: "lessons.names.fillingIn" },
        {
            kind: "place",
            stage: "follow",
            board: BOARD,
            marks: {},
            digit: 3,
            answer: cell(2, 4),
            promptKey: "lessons.names.pointing",
            successKey: "lessons.names.claiming",
            hints: [
                { textKey: "lessons.names.nakedPair" },
                { textKey: "lessons.names.hiddenPair", marks: { lit: [cell(2, 4)] } },
            ],
        },
        {
            kind: "fill",
            stage: "alone",
            board: BOARD,
            marks: {},
            rule: "answer",
            required: 2,
            promptKey: "lessons.names.xWing",
            successKey: "lessons.names.fish",
            hints: [],
        },
        { kind: "done", stage: "done", board: BOARD, marks: {}, takeawayKey: "lessons.names.xyWing" },
    ],
};

const NOTE_LESSON: Lesson = {
    id: "fillingIn",
    steps: [
        {
            kind: "note",
            stage: "follow",
            board: BOARD,
            marks: {},
            cell: cell(2, 2),
            digits: [2, 7],
            promptKey: "lessons.names.xWing",
            successKey: "lessons.names.fish",
            hints: [],
        },
    ],
};

const mountScreen = (lesson: Lesson = LESSON) => mount(LessonScreen, { props: { lesson } });
type Screen = ReturnType<typeof mountScreen>;

const explanation = (wrapper: Screen) => wrapper.get("[data-testid='lesson-explanation-region']").text();
const primary = (wrapper: Screen) => wrapper.get("[data-testid='lesson-primary']");
const secondary = (wrapper: Screen) => wrapper.get("[data-testid='lesson-secondary']");
const tap = async (wrapper: Screen, row: number, column: number) => {
    await wrapper.get(`[data-testid='lesson-cell-${row}-${column}']`).trigger("click");
    await flushPromises();
};
const nameOf = (lesson: string) => (i18n.global.messages.value.en.lessons.names as Record<string, string>)[lesson];

describe("LessonScreen", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        i18n.global.locale.value = "en";
    });

    afterEach(() => {
        localStorage.clear();
    });

    const toPractice = async (wrapper: Screen) => {
        await secondary(wrapper).trigger("click");
        await flushPromises();
    };

    it("should begin with the explanation's first step", () => {
        const wrapper = mountScreen();

        expect(explanation(wrapper)).toContain(nameOf("rules"));
    });

    it("should move through the explanation step by step", async () => {
        const wrapper = mountScreen();

        await primary(wrapper).trigger("click");
        await flushPromises();

        expect(explanation(wrapper)).toContain(nameOf("fillingIn"));
        expect(wrapper.find("[data-testid='cell-cross']").exists()).toBe(true);
    });

    it("should skip to the first practice step", async () => {
        const wrapper = mountScreen();

        await toPractice(wrapper);

        expect(explanation(wrapper)).toContain(nameOf("pointing"));
    });

    it("should not let an unsolved practice be passed", async () => {
        const wrapper = mountScreen();
        await toPractice(wrapper);

        expect(primary(wrapper).attributes("disabled")).toBeDefined();
        expect(wrapper.get("[data-testid='lesson-next']").attributes("disabled")).toBeDefined();
    });

    it("should let a solved practice be passed, and say so", async () => {
        const wrapper = mountScreen();
        await toPractice(wrapper);

        await tap(wrapper, 2, 4);

        expect(explanation(wrapper)).toContain(nameOf("claiming"));
        expect(primary(wrapper).attributes("disabled")).toBeUndefined();
        expect(wrapper.get("[data-testid='lesson-next']").attributes("disabled")).toBeUndefined();
    });

    it("should keep what was done when going back to a step", async () => {
        const wrapper = mountScreen();
        await toPractice(wrapper);
        await tap(wrapper, 2, 4);
        await primary(wrapper).trigger("click");
        await flushPromises();

        await wrapper.get("[data-testid='lesson-previous']").trigger("click");
        await flushPromises();

        expect(wrapper.get("[data-testid='lesson-cell-2-4'] [data-testid='cell-value']").text()).toBe("3");
    });

    it("should replace the prompt with the reason for a wrong tap, until the next tap", async () => {
        const wrapper = mountScreen();
        await toPractice(wrapper);

        await tap(wrapper, 1, 3);

        expect(wrapper.find("[data-testid='lesson-wrong']").exists()).toBe(true);
        expect(explanation(wrapper)).not.toContain(nameOf("pointing"));
        expect(wrapper.find("[data-testid='lesson-cell-1-3'] [data-testid='cell-value']").exists()).toBe(false);

        await tap(wrapper, 0, 3);

        expect(wrapper.find("[data-testid='lesson-wrong']").exists()).toBe(false);
        expect(explanation(wrapper)).toContain(nameOf("pointing"));
    });

    it("should give hints one level at a time, then disable the action", async () => {
        const wrapper = mountScreen();
        await toPractice(wrapper);

        await secondary(wrapper).trigger("click");
        await flushPromises();
        expect(wrapper.get("[data-testid='lesson-hint']").text()).toContain(nameOf("nakedPair"));
        expect(secondary(wrapper).attributes("disabled")).toBeUndefined();

        await secondary(wrapper).trigger("click");
        await flushPromises();
        expect(wrapper.get("[data-testid='lesson-hint']").text()).toContain(nameOf("hiddenPair"));
        expect(wrapper.get("[data-testid='lesson-cell-2-4']").attributes("data-variant")).toBe("answer");
        expect(secondary(wrapper).attributes("disabled")).toBeDefined();
    });

    it("should have no digit pad until a step leaves the digit to the player", async () => {
        const wrapper = mountScreen();
        await toPractice(wrapper);

        await tap(wrapper, 2, 4);

        expect(wrapper.find("[data-testid='digit-pad']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='floating-digit-pad']").exists()).toBe(false);
    });

    it("should open the floating pad on a cell the player must fill, even with its setting off", async () => {
        const settings = useSettingsStore();
        settings.setFloatingDigitPad(false);
        const wrapper = mountScreen();
        await toPractice(wrapper);
        await tap(wrapper, 2, 4);
        await primary(wrapper).trigger("click");
        await flushPromises();

        expect(wrapper.find("[data-testid='floating-digit-pad']").exists()).toBe(false);

        await tap(wrapper, 0, 0);

        expect(wrapper.find("[data-testid='floating-digit-pad']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='digit-pad']").exists()).toBe(false);
    });

    it("should fill a digit from the pad and show progress on the tag", async () => {
        const wrapper = mountScreen();
        await toPractice(wrapper);
        await tap(wrapper, 2, 4);
        await primary(wrapper).trigger("click");
        await flushPromises();

        await tap(wrapper, 2, 2);
        await wrapper.get("[data-testid='floating-number-7']").trigger("click");
        await flushPromises();

        expect(wrapper.get("[data-testid='lesson-cell-2-2'] [data-testid='cell-value']").text()).toBe("7");
        expect(wrapper.get("[data-testid='lesson-tag']").text()).toContain("1");
        expect(wrapper.find("[data-testid='floating-digit-pad']").exists()).toBe(false);
    });

    it("should offer the notes toggle only where notes are taught, and write them", async () => {
        const wrapper = mountScreen(NOTE_LESSON);

        await wrapper.get("[data-testid='lesson-note-toggle']").trigger("click");
        await tap(wrapper, 2, 2);
        await wrapper.get("[data-testid='floating-number-2']").trigger("click");
        await flushPromises();

        expect(wrapper.get("[data-testid='lesson-note-toggle']").attributes("aria-pressed")).toBe("true");
        expect(wrapper.get("[data-testid='lesson-cell-2-2']").text()).toContain("2");
    });

    it("should have no notes toggle elsewhere", async () => {
        const wrapper = mountScreen();
        await toPractice(wrapper);

        expect(wrapper.find("[data-testid='lesson-note-toggle']").exists()).toBe(false);
    });

    it("should ask to go back", async () => {
        const wrapper = mountScreen();

        await wrapper.get("[data-testid='back-button']").trigger("click");

        expect(wrapper.emitted("back")).toHaveLength(1);
    });

    it("should switch language with the app", async () => {
        const wrapper = mountScreen();
        const before = explanation(wrapper);

        i18n.global.locale.value = "zh-Hant";
        await flushPromises();

        expect(explanation(wrapper)).not.toBe(before);
    });
});
