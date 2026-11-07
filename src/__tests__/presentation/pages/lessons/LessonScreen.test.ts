import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import type { Lesson, LessonBoard } from "@/domain/lessons/Lesson";
import LessonScreen from "@/presentation/pages/lessons/LessonScreen.vue";
import { useGameStore } from "@/stores/gameStore";
import { useLessonStore } from "@/stores/lessonStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useStatisticsStore } from "@/stores/statisticsStore";
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

const FILL_LESSON: Lesson = {
    id: "fillingIn",
    steps: [
        {
            kind: "fill",
            stage: "follow",
            board: BOARD,
            marks: {},
            rule: "answer",
            required: 1,
            area: [cell(2, 3)],
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

    describe("a lesson that alternates explanation and practice", () => {
        const place = (promptKey: string) => ({
            kind: "place" as const,
            stage: "follow" as const,
            board: BOARD,
            marks: {},
            digit: 3,
            answer: cell(2, 4),
            promptKey,
            successKey: "lessons.names.claiming",
            hints: [],
        });
        const show = (textKey: string) => ({ kind: "show" as const, stage: "explain" as const, board: BOARD, marks: {}, textKey });
        const ALTERNATING: Lesson = {
            id: "fillingIn",
            steps: [
                show("lessons.names.rules"),
                show("lessons.names.hiddenSingle"),
                place("lessons.names.pointing"),
                show("lessons.names.fillingIn"),
                show("lessons.names.claiming"),
                place("lessons.names.xWing"),
                show("lessons.names.nakedPair"),
                { kind: "done", stage: "done", board: BOARD, marks: {}, takeawayKey: "lessons.names.xyWing" },
            ],
        };
        const action = (key: string) => i18n.global.t(`lessons.common.actions.${key}`);
        const solveAndGoOn = async (wrapper: Screen) => {
            await tap(wrapper, 2, 4);
            await primary(wrapper).trigger("click");
            await flushPromises();
        };

        it("should skip forward to the practice after this explanation, never back to an earlier one", async () => {
            const wrapper = mountScreen(ALTERNATING);
            await toPractice(wrapper);
            await solveAndGoOn(wrapper);
            expect(explanation(wrapper)).toContain(nameOf("fillingIn"));

            await toPractice(wrapper);

            expect(explanation(wrapper)).toContain(nameOf("xWing"));
        });

        it("should offer the practice as the next step, not also as a skip", async () => {
            const wrapper = mountScreen(ALTERNATING);
            await primary(wrapper).trigger("click");
            await flushPromises();

            expect(explanation(wrapper)).toContain(nameOf("hiddenSingle"));
            expect(primary(wrapper).text()).toBe(action("tryIt"));
            expect(wrapper.find("[data-testid='lesson-secondary']").exists()).toBe(false);
        });

        it("should not offer to skip when no practice is left", async () => {
            const wrapper = mountScreen(ALTERNATING);
            await toPractice(wrapper);
            await solveAndGoOn(wrapper);
            await toPractice(wrapper);
            await solveAndGoOn(wrapper);

            expect(explanation(wrapper)).toContain(nameOf("nakedPair"));
            expect(wrapper.find("[data-testid='lesson-secondary']").exists()).toBe(false);
            expect(primary(wrapper).attributes("disabled")).toBeUndefined();
            expect(primary(wrapper).text()).toBe(action("next"));
        });
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

    it("should let a light step go on once its digit is lit", async () => {
        const wrapper = mountScreen({
            id: "hiddenSingle",
            steps: [
                {
                    kind: "light",
                    stage: "follow",
                    board: BOARD,
                    marks: {},
                    digit: 7,
                    answer: cell(0, 6),
                    wrongKey: "lessons.names.rules",
                    promptKey: "lessons.names.pointing",
                    successKey: "lessons.names.claiming",
                    hints: [],
                },
                { kind: "done", stage: "done", board: BOARD, marks: {}, takeawayKey: "lessons.names.xyWing" },
            ],
        });
        expect(primary(wrapper).attributes("disabled")).toBeDefined();

        await tap(wrapper, 0, 0); // empty
        expect(wrapper.find("[data-testid='lesson-wrong']").exists()).toBe(true);
        expect(primary(wrapper).attributes("disabled")).toBeDefined();

        await tap(wrapper, 0, 6); // a 7

        expect(wrapper.get("[data-testid='lesson-cell-1-4']").attributes("data-variant")).toBe("target");
        expect(explanation(wrapper)).toContain(nameOf("claiming"));
        expect(primary(wrapper).attributes("disabled")).toBeUndefined();
    });

    it("should light every matching digit when a filled cell is tapped on a place step", async () => {
        const wrapper = mountScreen();
        await toPractice(wrapper);
        const variantAt = (row: number, column: number) =>
            wrapper.get(`[data-testid='lesson-cell-${row}-${column}']`).attributes("data-variant");

        await tap(wrapper, 0, 6); // a 7

        expect(variantAt(1, 4)).toBe("target"); // the 7 of row 2
        expect(variantAt(0, 3)).not.toBe("target"); // a 2
        expect(wrapper.find("[data-testid='lesson-wrong']").exists()).toBe(false);
    });

    it.each([
        ["row", 5, "conflictRow", { number: 3, digit: 5 }],
        ["column", 2, "conflictColumn", { number: 4, digit: 2 }],
        ["box", 7, "conflictBox", { number: 2, digit: 7 }],
    ] as const)("should say which %s already has the digit", async (_, digit, key, params) => {
        const wrapper = mountScreen(FILL_LESSON);

        await tap(wrapper, 2, 3);
        await wrapper.get(`[data-testid='floating-number-${digit}']`).trigger("click");
        await flushPromises();

        expect(wrapper.get("[data-testid='lesson-wrong']").text()).toBe(i18n.global.t(`lessons.common.feedback.${key}`, params));
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

    it("should draw a step's lines under the digits, only on a step that has them", async () => {
        const line = { from: cell(0, 0), to: cell(0, 2), digit: 4, type: "strong" as const };
        const wrapper = mountScreen({
            id: "xWing",
            steps: [
                { kind: "show", stage: "explain", board: BOARD, marks: {}, textKey: "lessons.names.rules" },
                { kind: "show", stage: "explain", board: BOARD, marks: { links: [line] }, textKey: "lessons.names.xWing" },
            ],
        });
        const grid = () => wrapper.get("[data-skin='board-grid']");
        expect(grid().classes()).not.toContain("has-step-links");

        await primary(wrapper).trigger("click");
        await flushPromises();

        expect(wrapper.find("[data-testid='step-link-overlay']").exists()).toBe(true);
        expect(grid().classes()).toContain("has-step-links");
    });

    it("should give the notes toggle a hook each style can mark its on state by", () => {
        const wrapper = mountScreen(NOTE_LESSON);

        expect(wrapper.get("[data-testid='lesson-note-toggle']").attributes("data-skin")?.split(" ")).toContain("lesson-toggle");
    });

    it("should have no notes toggle elsewhere", async () => {
        const wrapper = mountScreen();
        await toPractice(wrapper);

        expect(wrapper.find("[data-testid='lesson-note-toggle']").exists()).toBe(false);
    });

    describe("finishing", () => {
        const finish = async (wrapper: Screen) => {
            await toPractice(wrapper);
            await tap(wrapper, 2, 4);
            await primary(wrapper).trigger("click");
            await flushPromises();
            await tap(wrapper, 2, 2);
            await wrapper.get("[data-testid='floating-number-7']").trigger("click");
            await tap(wrapper, 2, 4);
            await tap(wrapper, 0, 0);
            await wrapper.get("[data-testid='floating-number-4']").trigger("click");
            await flushPromises();
            await primary(wrapper).trigger("click");
            await flushPromises();
        };

        const lessonNamed = (id: Lesson["id"]): Lesson => ({ ...LESSON, id });

        it("should record the lesson and show its takeaway on reaching the end", async () => {
            const store = useLessonStore();
            const wrapper = mountScreen();

            await finish(wrapper);

            expect(store.isFinished("hiddenSingle")).toBe(true);
            expect(explanation(wrapper)).toContain(nameOf("xyWing"));
        });

        it("should keep the last practice's board on the closing step", async () => {
            const wrapper = mountScreen();

            await finish(wrapper);

            expect(wrapper.get("[data-testid='lesson-cell-2-2'] [data-testid='cell-value']").text()).toBe("7");
        });

        it("should not record a lesson left before its end", async () => {
            const store = useLessonStore();
            const wrapper = mountScreen();

            await toPractice(wrapper);
            await tap(wrapper, 2, 4);
            await wrapper.get("[data-testid='back-button']").trigger("click");

            expect(store.isFinished("hiddenSingle")).toBe(false);
        });

        it("should offer the next lesson mid-group", async () => {
            const wrapper = mountScreen();

            await finish(wrapper);
            await primary(wrapper).trigger("click");

            expect(primary(wrapper).text()).toContain(nameOf("nakedSingle"));
            expect(wrapper.emitted("openLesson")).toEqual([["nakedSingle"]]);
        });

        it.each([
            ["nakedSingle", "easy"],
            ["hiddenSubset", "medium"],
            ["xyChain", "hard"],
        ] as const)("should offer a new game after %s, the end of %s", async (id, difficulty) => {
            const wrapper = mountScreen(lessonNamed(id));

            await finish(wrapper);
            await primary(wrapper).trigger("click");

            expect(wrapper.emitted("playDifficulty")).toEqual([[difficulty]]);
            expect(wrapper.emitted("openLesson")).toBeUndefined();
        });

        it("should go on to the next lesson after the basics, which have no difficulty", async () => {
            const wrapper = mountScreen(lessonNamed("fillingIn"));

            await finish(wrapper);
            await primary(wrapper).trigger("click");

            expect(wrapper.emitted("openLesson")).toEqual([["hiddenSingle"]]);
            expect(wrapper.emitted("playDifficulty")).toBeUndefined();
        });

        it("should go back to the list from its second action", async () => {
            const wrapper = mountScreen();

            await finish(wrapper);
            await secondary(wrapper).trigger("click");

            expect(wrapper.emitted("back")).toHaveLength(1);
        });

        it("should leave game statistics and the saved game alone", async () => {
            const statistics = useStatisticsStore();
            const game = useGameStore();
            const wrapper = mountScreen();
            const recordGame = vi.spyOn(statistics, "recordGame");

            await finish(wrapper);

            expect(recordGame).not.toHaveBeenCalled();
            expect(game.savedGame).toBeNull();
        });
    });

    it("should show how many cells are left on a step that needs several", async () => {
        const pick: Lesson = {
            id: "nakedPair",
            steps: [{
                kind: "pick",
                stage: "follow",
                board: BOARD,
                marks: {},
                targets: [cell(2, 2), cell(1, 2)],
                wrongKey: "lessons.names.xWing",
                promptKey: "lessons.names.xWing",
                successKey: "lessons.names.fish",
                hints: [],
            }],
        };
        const wrapper = mountScreen(pick);
        const tag = () => wrapper.get("[data-testid='lesson-tag']").text();

        expect(tag()).toContain("0");
        await tap(wrapper, 2, 2);

        expect(tag()).toContain("1");
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
