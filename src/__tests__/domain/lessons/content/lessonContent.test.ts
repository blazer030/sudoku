import { BOARD_SIZE } from "@/domain/board/constants";
import { LESSONS } from "@/domain/lessons/content";
import { ALL_LESSON_IDS } from "@/domain/lessons/curriculum";
import type { Lesson, LessonStep, PracticeStep, StepMarks } from "@/domain/lessons/Lesson";
import { freshPracticeState, practiceReducer, practiceValueAt, type PracticeAction, type PracticeState } from "@/domain/lessons/practice";
import { verifyLessonStep } from "@/domain/lessons/verifyLesson";
import type { CellReference } from "@/domain/solver/SolveStep";
import { en } from "@/presentation/i18n/messages/en";
import { zhHant } from "@/presentation/i18n/messages/zh-Hant";

const lessons: Lesson[] = Object.values(LESSONS);

const isPractice = (step: LessonStep): step is PracticeStep => step.kind !== "show" && step.kind !== "done";

const stringAt = (messages: object, key: string): unknown =>
    key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages);

const keysOf = (step: LessonStep): string[] => {
    if (step.kind === "show") return [step.textKey];
    if (step.kind === "done") return [step.takeawayKey];
    const keys = [step.promptKey, step.successKey, ...step.hints.map(hint => hint.textKey)];
    if (step.kind === "remove") keys.push(step.keepKey, step.wrongKey);
    if (step.kind === "pick") keys.push(step.wrongKey);
    if (step.kind === "place" && step.notYetKey !== undefined) keys.push(step.notYetKey);
    if (step.kind === "fill") {
        if (step.notYetKey !== undefined) keys.push(step.notYetKey);
        if (step.areaKey !== undefined) keys.push(step.areaKey);
    }
    return keys;
};

// The moves that solve a step, worked out from the step's own claims
const solution = (step: PracticeStep): PracticeAction[] => {
    const tap = ({ row, column }: { row: number; column: number }): PracticeAction => ({ kind: "tapCell", row, column });
    switch (step.kind) {
        case "place": return [tap(step.answer)];
        case "pick": return step.targets.map(tap);
        case "remove": return step.removals.map(({ cell }) => tap(cell));
        case "note": return [{ kind: "toggleNoteMode" }, tap(step.cell), ...step.digits.map((digit): PracticeAction => ({ kind: "pressDigit", digit }))];
        case "fill": return [];
    }
};

// Where a step's answer lies; a fill step's hints are worked out from the board, and tested with the reducer
const answerCells = (step: Exclude<PracticeStep, { kind: "fill" }>): readonly CellReference[] => {
    switch (step.kind) {
        case "place": return [step.answer];
        case "pick": return step.targets;
        case "remove": return step.removals.map(({ cell }) => cell);
        case "note": return [step.cell];
    }
};

const cellsShownBy = (marks: StepMarks = {}): readonly CellReference[] => [
    ...(marks.lit ?? []),
    ...(marks.targets ?? []),
    ...(marks.pattern ?? []),
    ...(marks.answers ?? []).map(({ cell }) => cell),
    ...(marks.eliminated ?? []).map(({ cell }) => cell),
];

const solveFill = (step: PracticeStep): PracticeState => {
    // A fill step's hints lead to a next move until it is solved, which is what a stuck player gets
    let state = freshPracticeState();
    for (let move = 0; move < 20 && !state.solved; move++) {
        for (let use = 0; use < 4; use++) state = practiceReducer(step, state, { kind: "requestHint" });
        const selected = state.selected;
        if (selected === null) throw new Error("A fill step's last hint selects no cell");
        const answer = /* digit */ fillDigit(state, step);
        state = practiceReducer(step, state, { kind: "pressDigit", digit: answer });
    }
    return state;
};

const fillDigit = (state: PracticeState, step: PracticeStep): number => {
    for (let digit = 1; digit <= 9; digit++) {
        const after = practiceReducer(step, state, { kind: "pressDigit", digit });
        if (after.placed.length > state.placed.length) return digit;
    }
    throw new Error("No digit fits the selected cell");
};

describe("the curriculum's content", () => {
    it("should have every lesson", () => {
        expect(lessons.map(lesson => lesson.id).sort()).toEqual([...ALL_LESSON_IDS].sort());
    });
});

describe.each(lessons.map(lesson => [lesson.id, lesson] as const))("lesson %s", (_, lesson) => {
    it("should run explanation, practice and closing, ending on its takeaway", () => {
        const order = ["explain", "follow", "alone", "done"];
        const stages = lesson.steps.map(step => step.stage);
        const isRulesOrInput = lesson.id === "rules" || lesson.id === "fillingIn";

        expect(stages[0]).toBe("explain");
        expect(stages[stages.length - 1]).toBe("done");
        expect(stages.filter(stage => stage === "done")).toHaveLength(1);
        expect(stages.includes("follow")).toBe(true);
        expect(stages.includes("alone")).toBe(!isRulesOrInput);
        if (!isRulesOrInput) {
            const ranks = stages.map(stage => order.indexOf(stage));
            expect(ranks).toEqual([...ranks].sort((first, second) => first - second));
        }
    });

    it("should only claim what the board and the solver back up", () => {
        for (const step of lesson.steps) expect(verifyLessonStep(step)).toEqual([]);
    });

    it("should have every word in both languages", () => {
        const keys = lesson.steps.flatMap(keysOf);

        for (const key of keys) {
            expect(typeof stringAt(en, key), `${key} in English`).toBe("string");
            expect(typeof stringAt(zhHant, key), `${key} in Chinese`).toBe("string");
        }
    });

    it("should have practice that can be solved, by a hint's lead where the digit is worked out", () => {
        for (const step of lesson.steps.filter(isPractice)) {
            const state = step.kind === "fill"
                ? solveFill(step)
                : solution(step).reduce((current, action) => practiceReducer(step, current, action), freshPracticeState());

            expect(state.solved, step.promptKey).toBe(true);
        }
    });

    it("should have hints that end on the answer's place, for steps with their own", () => {
        for (const step of lesson.steps.filter(isPractice)) {
            if (step.kind === "fill" || step.hints.length === 0) continue;
            expect(step.hints.length, step.promptKey).toBeGreaterThanOrEqual(2);

            const shown = cellsShownBy(step.hints[step.hints.length - 1].marks);
            for (const answer of answerCells(step)) {
                expect(shown, `${step.promptKey}, row ${answer.row} column ${answer.column}`).toContainEqual(answer);
            }
        }
    });

    it("should say why for every wrong move on an empty cell", () => {
        for (const step of lesson.steps.filter(isPractice)) {
            const fresh = step.kind === "note" ? { ...freshPracticeState(), noteMode: true } : freshPracticeState();
            for (let row = 0; row < BOARD_SIZE; row++) {
                for (let column = 0; column < BOARD_SIZE; column++) {
                    if (practiceValueAt(step.board, fresh, { row, column }) !== 0) continue;
                    const where = `${step.promptKey}, row ${row} column ${column}`;

                    const tapped = practiceReducer(step, fresh, { kind: "tapCell", row, column });
                    const moved = tapped.solved || tapped.selected !== null || tapped.picked.length > 0 || tapped.removed.length > 0;
                    if (!moved) expect(tapped.feedback, where).not.toBeNull();
                    if (tapped.selected === null) continue;

                    for (let digit = 1; digit <= BOARD_SIZE; digit++) {
                        const pressed = practiceReducer(step, tapped, { kind: "pressDigit", digit });
                        const accepted = pressed.placed.length > 0 || pressed.notes.length > 0;
                        if (!accepted) expect(pressed.feedback, `${where}, digit ${digit}`).not.toBeNull();
                    }
                }
            }
        }
    });

    it("should leave a player on their own to find the place, with nothing marked on the board", () => {
        for (const step of lesson.steps.filter(isPractice)) {
            if (step.stage !== "alone") continue;
            expect(step.marks.range, step.promptKey).toBeUndefined();
            expect(step.marks.pattern, step.promptKey).toBeUndefined();
            expect(step.marks.targets, step.promptKey).toBeUndefined();
        }
    });

    it("should only have notes in the lesson that teaches them, or on boards past the basics", () => {
        const isSingles = lesson.id === "hiddenSingle" || lesson.id === "nakedSingle" || lesson.id === "rules";
        for (const step of lesson.steps) {
            if (isSingles) expect(step.board.showsCandidates).toBe(false);
            else if (lesson.id !== "fillingIn" && step.kind !== "done") expect(step.board.showsCandidates).toBe(true);
        }
    });
});

describe("the Hidden Single lesson", () => {
    const steps = LESSONS.hiddenSingle.steps;
    const tipAt = steps.findIndex(step => step.kind === "show" && step.textKey === "lessons.content.hiddenSingle.tapToLight");

    it("should teach lighting a digit before the first practice", () => {
        expect(tipAt).toBeGreaterThan(-1);
        expect(tipAt).toBeLessThan(steps.findIndex(isPractice));
    });

    it("should show the tip lighting every 7 on the board", () => {
        const { board, marks } = steps[tipAt];
        const sevens: CellReference[] = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let column = 0; column < BOARD_SIZE; column++) {
                if (board.values[row * BOARD_SIZE + column] === "7") sevens.push({ row, column });
            }
        }

        expect(marks.targets).toEqual(sevens);
    });
});

describe("the Filling in lesson", () => {
    it("should dim nothing, as working out a cell takes the digits around it", () => {
        for (const step of LESSONS.fillingIn.steps) {
            expect(step.marks.dimOthers).toBeUndefined();
            expect(step.marks.noteDigit).toBeUndefined();
        }
    });
});
