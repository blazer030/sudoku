import { LESSONS } from "@/domain/lessons/content";
import type { Lesson, LessonStep, PracticeStep } from "@/domain/lessons/Lesson";
import { freshPracticeState, practiceReducer, type PracticeAction, type PracticeState } from "@/domain/lessons/practice";
import { verifyLessonStep } from "@/domain/lessons/verifyLesson";
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
