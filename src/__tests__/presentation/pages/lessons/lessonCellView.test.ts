import type { LessonBoard } from "@/domain/lessons/Lesson";
import { freshPracticeState } from "@/domain/lessons/practice";
import { lessonCellViews, mergeMarks } from "@/presentation/pages/lessons/lessonCellView";

/*
 . . .  2 6 .  7 . 1
 6 8 .  . 7 .  . 9 .
 1 9 .  . . 4  5 . .
*/
const BOARD: LessonBoard = {
    values: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
    showsCandidates: false,
};
const CANDIDATE_BOARD: LessonBoard = { ...BOARD, showsCandidates: true };
const cell = (row: number, column: number) => ({ row, column });

describe("lessonCellViews", () => {
    it("should show a range, a pattern and a target by their highlights, the strongest winning", () => {
        const views = lessonCellViews(BOARD, {
            range: [cell(0, 0), cell(0, 1), cell(0, 2), cell(0, 6)],
            pattern: [cell(0, 1)],
            targets: [cell(0, 6)],
        }, freshPracticeState());

        expect(views[0][0].highlight).toBe("scope");
        expect(views[0][1].highlight).toBe("pattern");
        expect(views[0][6].highlight).toBe("target");
        expect(views[4][4].highlight).toBe("none");
    });

    it("should dim unrelated digits but keep the range and the kept digit", () => {
        const views = lessonCellViews(BOARD, { range: [cell(1, 0)], dimOthers: true, keepDigit: 7 }, freshPracticeState());

        expect(views[1][0].dimmed).toBe(false); // 6 in the range
        expect(views[0][6].dimmed).toBe(false); // the kept 7
        expect(views[0][3].dimmed).toBe(true); // an unrelated 2
    });

    it("should dim nothing unless the step asks", () => {
        const views = lessonCellViews(BOARD, { range: [cell(1, 0)] }, freshPracticeState());

        expect(views[0][3].dimmed).toBe(false);
    });

    it("should mark a crossed cell", () => {
        const views = lessonCellViews(BOARD, { crossed: [cell(0, 0)] }, freshPracticeState());

        expect(views[0][0].crossed).toBe(true);
        expect(views[0][1].crossed).toBe(false);
    });

    it("should list candidates only on a board that shows them", () => {
        expect(lessonCellViews(BOARD, {}, freshPracticeState())[2][2].candidates).toBeNull();
        expect(lessonCellViews(CANDIDATE_BOARD, {}, freshPracticeState())[2][2].candidates).toEqual([2, 7]);
    });

    it("should stress the emphasized candidates in the pattern only", () => {
        const views = lessonCellViews(CANDIDATE_BOARD, { pattern: [cell(2, 2)], emphasized: [7] }, freshPracticeState());

        expect(views[2][2].emphasized).toEqual([7]);
        expect(views[0][0].emphasized).toEqual([]);
    });

    it("should dim every other candidate when a step is about one digit", () => {
        const views = lessonCellViews(CANDIDATE_BOARD, { noteDigit: 7 }, freshPracticeState());

        expect(views[2][2].dimmedNotes).toEqual([2]);
    });

    it("should dim the notes of unrelated cells", () => {
        const views = lessonCellViews(CANDIDATE_BOARD, { range: [cell(2, 2)], dimOthers: true }, freshPracticeState());

        expect(views[2][2].dimmedNotes).toEqual([]);
        expect(views[0][0].dimmedNotes).toEqual(views[0][0].candidates);
    });

    it("should strike what the step and the player removed", () => {
        const views = lessonCellViews(CANDIDATE_BOARD, { eliminated: [{ cell: cell(2, 2), digit: 2 }] }, {
            ...freshPracticeState(),
            removed: [{ cell: cell(2, 2), digit: 7 }],
        });

        expect(views[2][2].eliminated).toEqual([2, 7]);
    });

    it("should show a picked cell as part of the pattern", () => {
        const views = lessonCellViews(BOARD, {}, { ...freshPracticeState(), picked: [cell(2, 2)] });

        expect(views[2][2].highlight).toBe("pattern");
    });

    it("should show a wrong digit as wrong", () => {
        const views = lessonCellViews(BOARD, {}, { ...freshPracticeState(), wrong: { cell: cell(2, 2), digit: 3 } });

        expect(views[2][2].highlight).toBe("wrong");
    });

    it("should light the selected cell, and a placed digit, as answers", () => {
        const views = lessonCellViews(BOARD, {}, {
            ...freshPracticeState(),
            selected: cell(2, 2),
            placed: [{ cell: cell(2, 4), digit: 3 }],
        });

        expect(views[2][2].highlight).toBe("answer");
        expect(views[2][4].highlight).toBe("answer");
    });

    it("should light the digit of a tapped filled cell across the board", () => {
        const views = lessonCellViews(BOARD, {}, { ...freshPracticeState(), sameDigit: 7 });

        expect(views[0][6].highlight).toBe("target");
        expect(views[0][3].highlight).toBe("none");
    });
});

describe("mergeMarks", () => {
    it("should add a hint's cells to the step's and let its digits win", () => {
        const merged = mergeMarks(
            { range: [cell(0, 0)], keepDigit: 3 },
            { range: [cell(1, 1)], keepDigit: 5, lit: [cell(2, 2)] },
        );

        expect(merged.range).toEqual([cell(0, 0), cell(1, 1)]);
        expect(merged.lit).toEqual([cell(2, 2)]);
        expect(merged.keepDigit).toBe(5);
    });

    it("should leave the step's marks alone without a hint", () => {
        const marks = { range: [cell(0, 0)] };

        expect(mergeMarks(marks, undefined)).toBe(marks);
    });
});
