import type { Lesson } from "@/domain/lessons/Lesson";
import { useLessonSession } from "@/presentation/pages/lessons/useLessonSession";

const BOARD = {
    values: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
    showsCandidates: false,
};

describe("useLessonSession", () => {
    it("should put a step's supposed digits on the board it shows", () => {
        // Row 8, column 4 (counted from 1) is empty on the board
        const lesson: Lesson = {
            id: "hiddenSingle",
            steps: [{ kind: "show", stage: "explain", board: BOARD, marks: { supposed: [{ cell: { row: 7, column: 3 }, digit: 7 }] }, textKey: "text" }],
        };

        const session = useLessonSession(lesson);

        expect(session.puzzleCells.value[7][3].entry).toBe(7);
        expect(session.puzzleCells.value[7][4].entry).toBe(0);
    });
});
