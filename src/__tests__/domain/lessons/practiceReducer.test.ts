import { HIDDEN_SINGLE, RULES } from "@/domain/lessons/content/basicsAndEasy";
import type { FillStep, Lesson, LessonBoard, LessonStep, NoteStep, PickStep, PlaceStep, RemoveStep } from "@/domain/lessons/Lesson";
import { freshPracticeState, hintsFor, practiceReducer, type PracticeState } from "@/domain/lessons/practice";
import type { CellReference } from "@/domain/solver/SolveStep";

/*
 . . .  2 6 .  7 . 1
 6 8 .  . 7 .  . 9 .
 1 9 .  . . 4  5 . .
 8 2 .  1 . .  . 4 .
 . . 4  6 . 2  9 . .
 . 5 .  . . 3  . 2 8
 . . 9  3 . .  . 7 4
 . 4 .  . 5 .  . 3 6
 7 . 3  . 1 8  . . .
*/
const EASY_BOARD: LessonBoard = {
    values: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
    showsCandidates: false,
};

const cell = (row: number, column: number): CellReference => ({ row, column });
const boxTwo = [cell(0, 3), cell(0, 4), cell(0, 5), cell(1, 3), cell(1, 4), cell(1, 5), cell(2, 3), cell(2, 4), cell(2, 5)];

const placeStep: PlaceStep = {
    kind: "place",
    stage: "follow",
    board: EASY_BOARD,
    marks: {},
    digit: 3,
    answer: cell(2, 4),
    range: boxTwo,
    promptKey: "prompt",
    successKey: "success",
    hints: [
        { textKey: "first", marks: { crossed: [cell(1, 3)] } },
        { textKey: "second" },
        { textKey: "last", marks: { lit: [cell(2, 4)] } },
    ],
};

const tap = (row: number, column: number) => ({ kind: "tapCell", row, column }) as const;

const stepOfKind = <Kind extends LessonStep["kind"]>(lesson: Lesson, kind: Kind) =>
    lesson.steps.find((step): step is Extract<LessonStep, { kind: Kind }> => step.kind === kind) as Extract<LessonStep, { kind: Kind }>;

describe("the Rules lesson's hints", () => {
    const COMMON = "lessons.common.hints";
    const LEVELS = [`${COMMON}.lookAtCell`, `${COMMON}.countHouses`, `${COMMON}.answer`];

    it("should teach step by step, the answer last", () => {
        const step = stepOfKind(RULES, "fill");

        expect(hintsFor(step, freshPracticeState()).map(hint => hint.textKey)).toEqual(LEVELS);
    });

    it("should begin again on the next cell once one is filled", () => {
        const step = stepOfKind(RULES, "fill");
        const answer = hintsFor(step, freshPracticeState())[2];
        if (answer.selects === undefined || typeof answer.params?.digit !== "number") throw new Error("The last hint names the answer");
        const selected = practiceReducer(step, freshPracticeState(), { kind: "tapCell", ...answer.selects });
        const placed = practiceReducer(step, selected, { kind: "pressDigit", digit: answer.params.digit });

        const next = hintsFor(step, placed);

        expect(placed.hintLevel).toBe(0);
        expect(next.map(hint => hint.textKey)).toEqual(LEVELS);
        expect(next[2].selects).not.toEqual(answer.selects);
    });
});

describe("practiceReducer", () => {
    describe("placing a known digit", () => {
        it("should place the digit and solve the step on the right cell", () => {
            const state = practiceReducer(placeStep, freshPracticeState(), tap(2, 4));

            expect(state.solved).toBe(true);
            expect(state.placed).toEqual([{ cell: cell(2, 4), digit: 3 }]);
            expect(state.feedback).toBeNull();
        });

        it.each([
            ["the column already has it", tap(1, 3), { kind: "conflict", house: "column", number: 4, digit: 3 }],
            ["the other column already has it", tap(0, 5), { kind: "conflict", house: "column", number: 6, digit: 3 }],
            ["the cell is outside the range", tap(4, 0), { kind: "outsideRange" }],
        ] as const)("should say why when %s", (_, action, feedback) => {
            const state = practiceReducer(placeStep, freshPracticeState(), action);

            expect(state.solved).toBe(false);
            expect(state.placed).toEqual([]);
            expect(state.feedback).toEqual(feedback);
        });

        it.each([
            ["its row", 5, { kind: "conflict", house: "row", number: 3, digit: 5 }],
            ["its box", 7, { kind: "conflict", house: "box", number: 2, digit: 7 }],
        ] as const)("should name %s when that already has the digit", (_, digit, feedback) => {
            const state = practiceReducer({ ...placeStep, digit, range: undefined }, freshPracticeState(), tap(2, 3));

            expect(state.feedback).toEqual(feedback);
        });

        it("should ignore a filled cell", () => {
            const before = freshPracticeState();

            expect(practiceReducer(placeStep, before, tap(0, 3))).toBe(before);
        });

        it("should ignore taps once solved", () => {
            const solved = practiceReducer(placeStep, freshPracticeState(), tap(2, 4));

            expect(practiceReducer(placeStep, solved, tap(1, 3))).toBe(solved);
        });

        it("should clear the reason on the next tap", () => {
            const wrong = practiceReducer(placeStep, freshPracticeState(), tap(1, 3));

            expect(practiceReducer(placeStep, wrong, tap(2, 4)).feedback).toBeNull();
        });
    });

    describe("independent practice for a hidden single", () => {
        const step: PlaceStep = {
            ...placeStep,
            stage: "alone",
            digit: 5,
            answer: cell(6, 0),
            range: undefined,
            acceptsAnyHiddenSingle: true,
            notYetKey: "notYet",
        };

        it.each([[6, 0], [3, 5]])("should count either cell where 5 is a hidden single (%i, %i)", (row, column) => {
            const state = practiceReducer(step, freshPracticeState(), tap(row, column));

            expect(state.solved).toBe(true);
            expect(state.placed).toEqual([{ cell: cell(row, column), digit: 5 }]);
        });

        it("should say a free cell is not certain when its box has another place", () => {
            // Row 1, column 1 can hold 5 (no conflict), but so can other cells of box 1
            const state = practiceReducer(step, freshPracticeState(), tap(0, 0));

            expect(state.solved).toBe(false);
            expect(state.feedback).toEqual({ kind: "message", key: "notYet" });
        });
    });

    describe("picking a pattern", () => {
        const step: PickStep = {
            kind: "pick",
            stage: "follow",
            board: EASY_BOARD,
            marks: {},
            targets: [cell(2, 2), cell(1, 2)],
            promptKey: "prompt",
            successKey: "success",
            wrongKey: "wrong",
            hints: [],
        };

        it("should solve the step once every target is tapped", () => {
            const first = practiceReducer(step, freshPracticeState(), tap(2, 2));
            expect(first.solved).toBe(false);
            expect(first.picked).toEqual([cell(2, 2)]);

            expect(practiceReducer(step, first, tap(1, 2)).solved).toBe(true);
        });

        it("should say why for a cell that is not in the pattern", () => {
            const state = practiceReducer(step, freshPracticeState(), tap(0, 0));

            expect(state.picked).toEqual([]);
            expect(state.feedback).toEqual({ kind: "message", key: "wrong" });
        });

        it("should not count a target twice", () => {
            const first = practiceReducer(step, freshPracticeState(), tap(2, 2));

            expect(practiceReducer(step, first, tap(2, 2))).toBe(first);
        });
    });

    describe("removing candidates", () => {
        // Row 8 (counted from 1) has the pair 5, 8 in columns 2 and 3; column 8 can lose 5
        const pairBoard: LessonBoard = {
            values: "809207301763519824120803079502098037900730205370125098637980002200070903491352786",
            showsCandidates: true,
        };
        const step: RemoveStep = {
            kind: "remove",
            stage: "follow",
            board: pairBoard,
            marks: {},
            removals: [{ cell: cell(7, 7), digit: 5 }],
            pattern: [cell(7, 1), cell(7, 2)],
            digits: [5, 8],
            promptKey: "prompt",
            successKey: "success",
            keepKey: "keep",
            wrongKey: "wrong",
            hints: [],
        };

        it("should strike the candidate and solve the step", () => {
            const state = practiceReducer(step, freshPracticeState(), tap(7, 7));

            expect(state.removed).toEqual([{ cell: cell(7, 7), digit: 5 }]);
            expect(state.solved).toBe(true);
        });

        it("should say a cell of the pattern stays", () => {
            const state = practiceReducer(step, freshPracticeState(), tap(7, 1));

            expect(state.removed).toEqual([]);
            expect(state.feedback).toEqual({ kind: "message", key: "keep" });
        });

        it("should say a cell lacks the candidates in question", () => {
            // Row 8, column 4 (counted from 1) holds only 4 and 6
            const state = practiceReducer(step, freshPracticeState(), tap(7, 3));

            expect(state.feedback).toEqual({ kind: "noCandidates" });
        });

        it("should say why for any other cell that has them", () => {
            // Row 1, column 2 (counted from 1) holds 4 and 5, but is not in the pair's row
            const state = practiceReducer(step, freshPracticeState(), tap(0, 1));

            expect(state.feedback).toEqual({ kind: "message", key: "wrong" });
        });

        it("should need every removal", () => {
            const twoRemovals: RemoveStep = { ...step, removals: [...step.removals, { cell: cell(0, 1), digit: 5 }] };
            const first = practiceReducer(twoRemovals, freshPracticeState(), tap(7, 7));

            expect(first.solved).toBe(false);
            expect(practiceReducer(twoRemovals, first, tap(0, 1)).solved).toBe(true);
        });

        it("should remove from a cell of the pattern when that cell has removals, as a hidden pair's do", () => {
            const fromPattern: RemoveStep = { ...step, pattern: [cell(7, 7)] };

            expect(practiceReducer(fromPattern, freshPracticeState(), tap(7, 7)).solved).toBe(true);
        });

        it("should remove every candidate a tapped cell loses", () => {
            const twoDigits: RemoveStep = {
                ...step,
                removals: [{ cell: cell(7, 7), digit: 5 }, { cell: cell(7, 7), digit: 1 }],
            };
            const state = practiceReducer(twoDigits, freshPracticeState(), tap(7, 7));

            expect(state.removed).toEqual(twoDigits.removals);
            expect(state.solved).toBe(true);
        });
    });

    describe("working out a digit", () => {
        const step: FillStep = {
            kind: "fill",
            stage: "alone",
            board: EASY_BOARD,
            marks: {},
            rule: "nakedSingle",
            required: 1,
            area: Array.from({ length: 9 }, (_, column) => cell(7, column)),
            areaKey: "lookAtRow",
            notYetKey: "notYet",
            promptKey: "prompt",
            successKey: "success",
            hints: [],
        };
        const press = (digit: number) => ({ kind: "pressDigit", digit }) as const;

        it("should select an empty cell in the area", () => {
            const state = practiceReducer(step, freshPracticeState(), tap(7, 0));

            expect(state.selected).toEqual(cell(7, 0));
            expect(state.feedback).toBeNull();
        });

        it("should send a tap outside the area back to it", () => {
            const state = practiceReducer(step, freshPracticeState(), tap(3, 2));

            expect(state.selected).toBeNull();
            expect(state.feedback).toEqual({ kind: "message", key: "lookAtRow" });
        });

        it("should ignore a digit while no cell is selected, as the pad is not shown then", () => {
            const before = freshPracticeState();

            expect(practiceReducer(step, before, press(2))).toBe(before);
        });

        it("should fill the digit that is the only one left and solve the step", () => {
            const selected = practiceReducer(step, freshPracticeState(), tap(7, 0));
            const state = practiceReducer(step, selected, press(2));

            expect(state.placed).toEqual([{ cell: cell(7, 0), digit: 2 }]);
            expect(state.solved).toBe(true);
            expect(state.selected).toBeNull();
        });

        it("should mark a clashing digit wrong and keep the cell selected", () => {
            const selected = practiceReducer(step, freshPracticeState(), tap(7, 0));
            const state = practiceReducer(step, selected, press(4));

            expect(state.placed).toEqual([]);
            expect(state.wrong).toEqual({ cell: cell(7, 0), digit: 4 });
            expect(state.selected).toEqual(cell(7, 0));
            expect(state.feedback).toEqual({ kind: "conflict", house: "row", number: 8, digit: 4 });
        });

        it("should say a free digit is not certain when the cell has other possibilities", () => {
            // Row 8, column 3 (counted from 1) can hold 1, 2 or 8
            const selected = practiceReducer(step, freshPracticeState(), tap(7, 2));
            const state = practiceReducer(step, selected, press(1));

            expect(state.feedback).toEqual({ kind: "message", key: "notYet" });
        });

        it("should count up to the number required, by the answer", () => {
            const rule: FillStep = {
                ...step,
                rule: "answer",
                area: undefined,
                required: 2,
                board: {
                    values: "035269781682571493197834562826195347374682915951743628519326874248957136763418250",
                    showsCandidates: false,
                },
            };
            let state: PracticeState = practiceReducer(rule, freshPracticeState(), tap(0, 0));
            state = practiceReducer(rule, state, press(4));

            expect(state.solved).toBe(false);
            expect(state.placed).toEqual([{ cell: cell(0, 0), digit: 4 }]);

            state = practiceReducer(rule, state, tap(8, 8));
            state = practiceReducer(rule, state, press(9));

            expect(state.solved).toBe(true);
        });

        it("should highlight a filled cell's digit instead of selecting it", () => {
            const state = practiceReducer(step, freshPracticeState(), tap(7, 1));

            expect(state.selected).toBeNull();
            expect(state.sameDigit).toBe(4);
        });
    });

    describe("writing notes", () => {
        const step: NoteStep = {
            kind: "note",
            stage: "follow",
            board: EASY_BOARD,
            marks: {},
            cell: cell(2, 2),
            digits: [2, 7],
            promptKey: "prompt",
            successKey: "success",
            hints: [],
        };
        const press = (digit: number) => ({ kind: "pressDigit", digit }) as const;
        const ready = () => {
            const noteMode = practiceReducer(step, freshPracticeState(), { kind: "toggleNoteMode" });
            return practiceReducer(step, noteMode, tap(2, 2));
        };

        it("should need the note mode first", () => {
            const selected = practiceReducer(step, freshPracticeState(), tap(2, 2));
            const state = practiceReducer(step, selected, press(2));

            expect(state.notes).toEqual([]);
            expect(state.feedback).toEqual({ kind: "turnOnNotes" });
        });

        it("should solve the step once every candidate is written", () => {
            let state = practiceReducer(step, ready(), press(2));
            expect(state.notes).toEqual([2]);
            expect(state.solved).toBe(false);

            state = practiceReducer(step, state, press(7));
            expect(state.notes).toEqual([2, 7]);
            expect(state.solved).toBe(true);
        });

        it("should say why a digit does not belong", () => {
            const state = practiceReducer(step, ready(), press(9));

            expect(state.notes).toEqual([]);
            expect(state.feedback).toEqual({ kind: "conflict", house: "row", number: 3, digit: 9 });
        });

        it("should only let the named cell be selected", () => {
            const state = practiceReducer(step, freshPracticeState(), tap(0, 0));

            expect(state.selected).toBeNull();
            expect(state.feedback).toEqual({ kind: "outsideRange" });
        });
    });

    describe("hints", () => {
        const requestHint = { kind: "requestHint" } as const;

        it("should give more with each use, up to the last level", () => {
            const first = practiceReducer(placeStep, freshPracticeState(), requestHint);
            const second = practiceReducer(placeStep, first, requestHint);
            const last = practiceReducer(placeStep, second, requestHint);

            expect([first.hintLevel, second.hintLevel, last.hintLevel]).toEqual([1, 2, 3]);
            expect(practiceReducer(placeStep, last, requestHint)).toBe(last);
        });

        it("should replace a wrong answer's reason", () => {
            const wrong = practiceReducer(placeStep, freshPracticeState(), tap(1, 3));

            expect(practiceReducer(placeStep, wrong, requestHint).feedback).toBeNull();
        });

        it("should narrow the Hidden Single lesson's own hints from the box, to the digit's place, to the cell", () => {
            const alone = HIDDEN_SINGLE.steps.find(step => step.stage === "alone");
            if (alone?.kind !== "place") throw new Error("Hidden Single ends with placing a digit on its own");

            const [box, digit, answer, ...rest] = hintsFor(alone, freshPracticeState());

            expect(rest).toEqual([]);
            expect(box.marks?.range).toHaveLength(9);
            expect(box.marks?.lit).toBeUndefined();
            expect(box.marks?.keepDigit).toBeUndefined();
            expect(digit.marks?.range).toEqual(box.marks?.range);
            expect(digit.marks?.keepDigit).toBe(alone.digit);
            expect(digit.marks?.lit).toBeUndefined();
            expect(answer.marks?.lit).toEqual([alone.answer]);
        });

        it("should select the answer's cell at a fill step's last hint", () => {
            const step: FillStep = {
                kind: "fill",
                stage: "follow",
                board: EASY_BOARD,
                marks: {},
                rule: "answer",
                required: 1,
                area: [cell(2, 3)],
                promptKey: "prompt",
                successKey: "success",
                hints: [],
            };
            const hintCount = hintsFor(step, freshPracticeState()).length;
            let state = freshPracticeState();
            for (let use = 0; use < hintCount; use++) state = practiceReducer(step, state, requestHint);

            expect(state.selected).toEqual(cell(2, 3));
        });
    });
});
