import { describe, expect, it, vi } from "vitest";
import type { Sudoku } from "@/domain/game/Sudoku";
import type { RevealHintPlan } from "@/domain/game/RevealHint";
import type { CellReference } from "@/domain/solver/SolveStep";
import { createKnownSudoku } from "@/__tests__/fixtures/knownPuzzle";
import { createMultiStepSudoku } from "@/__tests__/fixtures/multiStepPuzzle";
import { useHintMode } from "@/presentation/pages/game/hint-mode/useHintMode";

type StepsPlan = Extract<RevealHintPlan, { kind: "steps" }>;

const snapshotBoard = (sudoku: Sudoku) =>
    sudoku.puzzle.map((row) => row.map((cell) => ({ entry: cell.entry, notes: [...cell.notes] })));

const setup = (sudoku: Sudoku) => {
    const record = vi.fn<(action: "hint" | "erase", cell: CellReference, value: number) => void>();
    const onApplied = vi.fn<(cell: CellReference) => void>();
    const hintMode = useHintMode(sudoku, { autoRemoveNotes: () => true, onApplied, record });
    return { hintMode, record, onApplied };
};

const planSteps = (sudoku: Sudoku): StepsPlan => {
    const plan = sudoku.planRevealHint();
    if (plan.kind !== "steps") throw new Error(`expected a steps plan, got ${plan.kind}`);
    return plan;
};

describe("useHintMode", () => {
    describe("wrong entry", () => {
        // Known puzzle: (1, 1) should be 7; the player wrote 1 and kept notes in it.
        const withWrongEntry = () => {
            const sudoku = createKnownSudoku();
            sudoku.puzzle[1][1].restore(1, [2, 7]);
            sudoku.toggleNote(0, 2, 4);
            return sudoku;
        };

        it("enters the wrong-entry phase and highlights only that cell", () => {
            const sudoku = withWrongEntry();
            const { hintMode } = setup(sudoku);

            hintMode.start(sudoku.planRevealHint());

            expect(hintMode.active.value).toBe(true);
            expect(hintMode.phase.value).toBe("wrongEntry");
            expect(hintMode.wrongCell.value).toEqual({ row: 1, column: 1 });
            expect(hintMode.cellView(1, 1).highlight).toBe("wrong");
            expect(hintMode.cellView(0, 2)).toEqual({ highlight: "none", candidates: null, eliminated: [], emphasized: [] });
        });

        it("clearWrongEntry erases only that entry, keeps its notes, records an erase and ends", () => {
            const sudoku = withWrongEntry();
            const { hintMode, record } = setup(sudoku);
            hintMode.start(sudoku.planRevealHint());

            hintMode.clearWrongEntry();

            expect(sudoku.puzzle[1][1].entry).toBe(0);
            expect(sudoku.puzzle[1][1].notes).toEqual([2, 7]);
            expect(sudoku.puzzle[0][2].notes).toEqual([4]);
            expect(record).toHaveBeenCalledWith("erase", { row: 1, column: 1 }, 0);
            expect(hintMode.active.value).toBe(false);
            expect(hintMode.phase.value).toBeNull();
        });

        it("cancel ends the hint and leaves the board unchanged", () => {
            const sudoku = withWrongEntry();
            const { hintMode, record } = setup(sudoku);
            const before = snapshotBoard(sudoku);
            hintMode.start(sudoku.planRevealHint());

            hintMode.cancel();

            expect(hintMode.active.value).toBe(false);
            expect(snapshotBoard(sudoku)).toEqual(before);
            expect(record).not.toHaveBeenCalled();
        });
    });

    describe("steps", () => {
        it("ignores plans that cannot be shown step by step", () => {
            const { hintMode } = setup(createKnownSudoku());

            hintMode.start({ kind: "noTechnique" });

            expect(hintMode.active.value).toBe(false);
        });

        it("isLastStep is true only on the last step and next/previous stay in bounds", () => {
            const sudoku = createMultiStepSudoku();
            const plan = planSteps(sudoku);
            const { hintMode } = setup(sudoku);

            hintMode.start(plan);
            expect(hintMode.phase.value).toBe("steps");
            expect(hintMode.stepIndex.value).toBe(0);
            expect(hintMode.isLastStep.value).toBe(false);

            hintMode.previous();
            expect(hintMode.stepIndex.value).toBe(0);

            for (let index = 1; index < plan.steps.length; index++) hintMode.next();
            expect(hintMode.stepIndex.value).toBe(plan.steps.length - 1);
            expect(hintMode.isLastStep.value).toBe(true);

            hintMode.next();
            expect(hintMode.stepIndex.value).toBe(plan.steps.length - 1);

            hintMode.previous();
            expect(hintMode.isLastStep.value).toBe(false);
        });

        it("cellView shows the computed candidates, the eliminated digits and the step's scope", () => {
            const sudoku = createMultiStepSudoku();
            const plan = planSteps(sudoku);
            const { hintMode } = setup(sudoku);
            hintMode.start(plan);

            const [first] = plan.steps;
            const elimination = first.step.eliminations[0];
            const eliminatedView = hintMode.cellView(elimination.cell.row, elimination.cell.column);
            expect(eliminatedView.candidates).toEqual(
                first.candidatesBefore[elimination.cell.row][elimination.cell.column]);
            expect(eliminatedView.eliminated).toContain(elimination.digit);

            const focus = first.step.focus[0];
            const focusView = hintMode.cellView(focus.row, focus.column);
            expect(focusView.highlight).toBe("pattern");
            expect(focusView.candidates).toEqual(first.candidatesBefore[focus.row][focus.column]);

            // The first step is a naked pair inside one house: its other cells are in scope.
            const [scope] = first.step.scopes;
            const inScope = (row: number, column: number): boolean => {
                if (scope.kind === "row") return row === scope.row;
                if (scope.kind === "column") return column === scope.column;
                return Math.floor(row / 3) * 3 === scope.boxRow && Math.floor(column / 3) * 3 === scope.boxColumn;
            };
            const scopeCell = [...Array(81).keys()]
                .map((index) => ({ row: Math.floor(index / 9), column: index % 9 }))
                .find((cell) => inScope(cell.row, cell.column)
                    && !first.step.focus.some((focusCell) => focusCell.row === cell.row && focusCell.column === cell.column));
            if (scopeCell === undefined) throw new Error("no scope cell outside the pair");
            expect(first.step.technique).toBe("nakedPair");
            expect(hintMode.cellView(scopeCell.row, scopeCell.column).highlight).toBe("scope");
        });

        it("cellView hides the player's notes on cells the hint does not use", () => {
            const sudoku = createMultiStepSudoku();
            sudoku.autoNotes();
            const plan = planSteps(sudoku);
            const involved = new Set(plan.steps.flatMap(({ step }) => [
                ...step.focus,
                ...step.eliminations.map((elimination) => elimination.cell),
                ...step.assignments.map((assignment) => assignment.cell),
            ]).map((cell) => `${cell.row}-${cell.column}`));
            const { hintMode } = setup(sudoku);
            hintMode.start(plan);

            const views = [];
            for (let row = 0; row < 9; row++) {
                for (let column = 0; column < 9; column++) {
                    const cell = sudoku.puzzle[row][column];
                    if (cell.isClue || cell.hasEntry) {
                        expect(hintMode.cellView(row, column).candidates).toBeNull();
                    } else if (!involved.has(`${row}-${column}`)) {
                        views.push(hintMode.cellView(row, column));
                    }
                }
            }
            // Cells outside every scope stay blank instead of showing the player's notes.
            expect(views.some((view) => view.candidates !== null && view.candidates.length === 0)).toBe(true);
        });

        it("cellView marks the answer cell and circles the digit on the last step only", () => {
            const sudoku = createMultiStepSudoku();
            const plan = planSteps(sudoku);
            const { hintMode } = setup(sudoku);
            hintMode.start(plan);
            const { row, column } = plan.target;

            expect(hintMode.cellView(row, column).highlight).not.toBe("answer");

            for (let index = 1; index < plan.steps.length; index++) hintMode.next();

            expect(hintMode.cellView(row, column).highlight).toBe("answer");
            expect(hintMode.cellView(row, column).emphasized).toEqual([plan.digit]);
            expect(hintMode.answer.value).toEqual({ cell: plan.target, digit: plan.digit });
        });

        it("fill applies the hint like applyRevealHint, records a hint step and ends", () => {
            const sudoku = createMultiStepSudoku();
            const expected = createMultiStepSudoku();
            for (const target of [sudoku, expected]) {
                target.autoNotes();
                target.toggleNote(8, 8, 3);
            }
            const plan = planSteps(sudoku);
            const { hintMode, record, onApplied } = setup(sudoku);
            hintMode.start(plan);
            for (let index = 1; index < plan.steps.length; index++) hintMode.next();

            hintMode.fill();

            expected.applyRevealHint(
                plan.target,
                plan.digit,
                plan.steps.flatMap(({ step }) => step.eliminations),
                { autoRemoveNotes: true },
            );
            expect(snapshotBoard(sudoku)).toEqual(snapshotBoard(expected));
            expect(record).toHaveBeenCalledWith("hint", plan.target, plan.digit);
            expect(onApplied).toHaveBeenCalledWith(plan.target);
            expect(hintMode.active.value).toBe(false);
        });

        it("cancel on any step leaves the board unchanged", () => {
            const sudoku = createMultiStepSudoku();
            sudoku.autoNotes();
            const before = snapshotBoard(sudoku);
            const { hintMode, record, onApplied } = setup(sudoku);
            hintMode.start(planSteps(sudoku));
            hintMode.next();

            hintMode.cancel();

            expect(hintMode.active.value).toBe(false);
            expect(snapshotBoard(sudoku)).toEqual(before);
            expect(record).not.toHaveBeenCalled();
            expect(onApplied).not.toHaveBeenCalled();
        });
    });
});
