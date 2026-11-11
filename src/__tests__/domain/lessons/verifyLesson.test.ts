import type { LessonBoard, LessonStep, RemoveStep } from "@/domain/lessons/Lesson";
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

const removeStep = (removals: { cell: { row: number; column: number }; digit: number }[]): RemoveStep => ({
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

    describe("supposed digits", () => {
        // The easy board: row 3, column 3 (counted from 1) is box 1's only place for a 7
        const easyBoard: LessonBoard = {
            values: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
            showsCandidates: false,
        };
        const boxOne = [0, 1, 2].flatMap(row => [0, 1, 2].map(column => ({ row, column })));
        // A 7 at row 8, column 4 fits, though the answer there is 9
        const supposedSeven = { cell: { row: 7, column: 3 }, digit: 7 };
        // It leaves row 6 one place for its 7: row 6, column 3, whose 7 takes box 1's last place
        const followingSeven = { cell: { row: 5, column: 2 }, digit: 7 };
        const supposing = (
            supposed: readonly { cell: { row: number; column: number }; digit: number }[],
            contradiction?: { digit: number; range: readonly { row: number; column: number }[] },
        ): LessonStep => ({
            kind: "show",
            stage: "explain",
            board: easyBoard,
            marks: { supposed },
            textKey: "text",
            ...(contradiction ? { contradiction } : {}),
        });

        it("should accept a supposed digit that fits but is not the answer, followed by a single", () => {
            expect(verifyLessonStep(supposing([supposedSeven]))).toEqual([]);
            expect(verifyLessonStep(supposing([supposedSeven, followingSeven]))).toEqual([]);
        });

        it("should report a supposed digit in a cell that already has one", () => {
            // Row 1, column 4 holds a 2
            expect(verifyLessonStep(supposing([{ cell: { row: 0, column: 3 }, digit: 7 }]))).not.toEqual([]);
        });

        it("should report a supposed digit that clashes with the board", () => {
            // Column 1 already has a 7, at row 9
            expect(verifyLessonStep(supposing([{ cell: { row: 7, column: 0 }, digit: 7 }]))).not.toEqual([]);
        });

        it("should report a supposed digit that clashes with an earlier one", () => {
            // Row 8 already has the supposed 7
            const sameRow = { cell: { row: 7, column: 2 }, digit: 7 };
            expect(verifyLessonStep(supposing([supposedSeven, sameRow]))).not.toEqual([]);
        });

        it("should report a first supposed digit that is the cell's answer", () => {
            expect(verifyLessonStep(supposing([{ cell: { row: 2, column: 2 }, digit: 7 }]))).not.toEqual([]);
        });

        it("should report a later supposed digit that is not a single", () => {
            // Row 1, column 6 could still be 5 or 9 with the supposed 7 on the board
            const notASingle = { cell: { row: 0, column: 5 }, digit: 5 };
            expect(verifyLessonStep(supposing([supposedSeven, notASingle]))).not.toEqual([]);
        });

        it("should accept a contradiction that holds once every supposed digit is on the board", () => {
            const step = supposing([supposedSeven, followingSeven], { digit: 7, range: boxOne });

            expect(verifyLessonStep(step)).toEqual([]);
        });

        it("should report a contradiction with a cell of its range still open to the digit", () => {
            // With only the first 7, row 3, column 3 can still be 7
            const step = supposing([supposedSeven], { digit: 7, range: boxOne });

            expect(verifyLessonStep(step)).not.toEqual([]);
        });

        it("should report a contradiction in a range that already holds the digit", () => {
            // Row 1 has a 7 at column 7
            const rowOne = Array.from({ length: 9 }, (_, column) => ({ row: 0, column }));
            const step = supposing([supposedSeven, followingSeven], { digit: 7, range: rowOne });

            expect(verifyLessonStep(step)).not.toEqual([]);
        });
    });
});
