import type { LessonBoard, LessonStep } from "@/domain/lessons/Lesson";
import { verifyLessonStep } from "@/domain/lessons/verifyLesson";

// A real position from the solver: rows 6 and 7 hold their 2s in columns 5 and 7 only (counted from 1)
const X_WING_BOARD: LessonBoard = {
    values: "738415962925683174164279800293158647806940001401006098680004010510800406342561789",
    removedCandidates: [{ cell: { row: 5, column: 6 }, digit: 3 }],
    showsCandidates: true,
};

const corners = [
    { row: 5, column: 4 },
    { row: 5, column: 6 },
    { row: 6, column: 4 },
    { row: 6, column: 6 },
];

const removeStep = (removals: { cell: { row: number; column: number }; digit: number }[]): LessonStep => ({
    kind: "remove",
    stage: "follow",
    board: X_WING_BOARD,
    marks: { pattern: corners },
    technique: "xWing",
    removals,
    pattern: corners,
    promptKey: "prompt",
    successKey: "success",
    keepKey: "keep",
    wrongKey: "wrong",
    hints: [],
});

describe("verifyLessonStep", () => {
    it("should accept a step that matches what the solver's technique finds", () => {
        const step = removeStep([
            { cell: { row: 7, column: 4 }, digit: 2 },
            { cell: { row: 4, column: 6 }, digit: 2 },
        ]);

        expect(verifyLessonStep(step)).toEqual([]);
    });

    it("should report a removal the technique does not make", () => {
        const step = removeStep([
            { cell: { row: 7, column: 4 }, digit: 2 },
            { cell: { row: 4, column: 7 }, digit: 2 },
        ]);

        expect(verifyLessonStep(step)).not.toEqual([]);
    });

    it("should report a pattern the technique does not use", () => {
        const step: LessonStep = {
            ...removeStep([
                { cell: { row: 7, column: 4 }, digit: 2 },
                { cell: { row: 4, column: 6 }, digit: 2 },
            ]),
            pattern: [corners[0], corners[1]],
        };

        expect(verifyLessonStep(step)).not.toEqual([]);
    });

    it("should report a board without exactly one solution", () => {
        const step: LessonStep = {
            kind: "show",
            stage: "explain",
            board: { values: "0".repeat(81), showsCandidates: false },
            marks: {},
            textKey: "text",
        };

        expect(verifyLessonStep(step)).not.toEqual([]);
    });

    it("should report a board of the wrong size", () => {
        const step: LessonStep = {
            kind: "show",
            stage: "explain",
            board: { values: "123", showsCandidates: false },
            marks: {},
            textKey: "text",
        };

        expect(verifyLessonStep(step)).not.toEqual([]);
    });

    it("should report a placement that is not the board's answer", () => {
        const board: LessonBoard = {
            values: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
            showsCandidates: false,
        };
        const placement = (column: number): LessonStep => ({
            kind: "place",
            stage: "follow",
            board,
            marks: {},
            digit: 7,
            answer: { row: 2, column },
            promptKey: "prompt",
            successKey: "success",
            hints: [],
        });

        expect(verifyLessonStep(placement(2))).toEqual([]);
        expect(verifyLessonStep(placement(3))).not.toEqual([]);
    });

    it("should report a removed candidate that is the cell's answer", () => {
        const step: LessonStep = {
            kind: "show",
            stage: "explain",
            board: {
                values: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
                // The answer at row 3, column 3 (counted from 1) is 7
                removedCandidates: [{ cell: { row: 2, column: 2 }, digit: 7 }],
                showsCandidates: false,
            },
            marks: {},
            textKey: "text",
        };

        expect(verifyLessonStep(step)).not.toEqual([]);
    });
});
