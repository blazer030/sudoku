import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { i18n } from "@/presentation/i18n";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import SolverWalkthrough from "@/presentation/pages/solver-walkthrough/SolverWalkthrough.vue";
import { BoardState } from "@/domain/solver/BoardState";
import { buildSolvePath } from "@/domain/solver/SolvePath";
import { scopeCells } from "@/presentation/components/step-presentation/stepCellView";
import { TechniqueSolver } from "@/domain/solver/TechniqueSolver";
import { singlesPuzzle, singlesSolution } from "@/__tests__/fixtures/singlesPuzzle";
import { SAMPLE_PUZZLES } from "@/presentation/pages/solver-walkthrough/samplePuzzles";

const mediumPreset = SAMPLE_PUZZLES.find((preset) => preset.label === "Medium");
if (!mediumPreset) throw new Error("expected Medium preset to exist");
const mediumPuzzle = mediumPreset.puzzle;
const hardPreset = SAMPLE_PUZZLES.find((preset) => preset.label === "Hard");
if (!hardPreset) throw new Error("expected Hard preset to exist");
const hardPuzzle = hardPreset.puzzle;

const singlesStepCount = buildSolvePath(singlesPuzzle).length;

const fillPuzzle = async (wrapper: VueWrapper, puzzle: number[][]) => {
    for (let row = 0; row < 9; row++) {
        for (let column = 0; column < 9; column++) {
            const digit = puzzle[row][column];
            if (digit === 0) continue;
            await wrapper.find(`[data-testid='solver-cell-${row}-${column}']`).trigger("click");
            await wrapper.find(`[data-testid='number-${digit}']`).trigger("click");
        }
    }
};

const createTestRouter = () => createRouter({
    history: createMemoryHistory(),
    routes: [
        { path: "/", component: { template: "<div>Home</div>" } },
        { path: "/solver", component: SolverWalkthrough },
    ],
});

const mountWalkthrough = () => {
    const router = createTestRouter();
    const wrapper = mount(SolverWalkthrough, { global: { plugins: [router] } });
    return { wrapper, router };
};

const solve = async (wrapper: VueWrapper) => {
    await wrapper.find("[data-testid='solve-button']").trigger("click");
    await flushPromises();
};

const clickNext = async (wrapper: VueWrapper, times: number) => {
    for (let click = 0; click < times; click++) {
        await wrapper.find("[data-testid='walkthrough-next']").trigger("click");
    }
};

const cellAt = (wrapper: VueWrapper, row: number, column: number) =>
    wrapper.find(`[data-testid='solver-cell-${row}-${column}']`);

const firstSinglesStep = () => {
    const step = new TechniqueSolver().nextStep(BoardState.fromPuzzle(singlesPuzzle));
    if (step === null || step.assignments.length === 0) throw new Error("expected a first assignment step");
    return step;
};

afterEach(() => {
    vi.useRealTimers();
});

describe("SolverWalkthrough", () => {
    describe("entering a puzzle", () => {
        it("should render a 9x9 board on mount", () => {
            const { wrapper } = mountWalkthrough();

            for (let row = 0; row < 9; row++) {
                for (let column = 0; column < 9; column++) {
                    expect(cellAt(wrapper, row, column).exists()).toBe(true);
                }
            }
        });

        it("should lay the board out as flex rows like the game board so cells in a row share one height", () => {
            const { wrapper } = mountWalkthrough();

            for (let row = 0; row < 9; row++) {
                const rowElement = wrapper.find(`[data-testid='solver-row-${row}']`);
                expect(rowElement.classes()).toContain("flex");
                for (let column = 0; column < 9; column++) {
                    expect(rowElement.find(`[data-testid='solver-cell-${row}-${column}']`).exists()).toBe(true);
                }
            }
        });

        it("should leave empty cells blank while entering a puzzle", async () => {
            const { wrapper } = mountWalkthrough();

            expect(cellAt(wrapper, 0, 0).text()).toBe("");

            await wrapper.find("[data-testid='number-9']").trigger("click");
            await cellAt(wrapper, 0, 0).trigger("click");

            expect(cellAt(wrapper, 0, 1).text()).toBe("");
        });

        it("should show entered digits as givens", async () => {
            const { wrapper } = mountWalkthrough();

            await cellAt(wrapper, 3, 4).trigger("click");
            await wrapper.find("[data-testid='number-7']").trigger("click");

            expect(cellAt(wrapper, 3, 4).find("[data-testid='cell-value']").classes()).toContain("font-bold");
        });

        it("should reject filling a digit that clashes with a peer", async () => {
            const { wrapper } = mountWalkthrough();

            await wrapper.find("[data-testid='number-9']").trigger("click");
            await cellAt(wrapper, 0, 0).trigger("click");
            await cellAt(wrapper, 0, 1).trigger("click");

            expect(cellAt(wrapper, 0, 1).text()).toBe("");
        });

        it("should fill selected cell when a digit is picked", async () => {
            const { wrapper } = mountWalkthrough();

            await cellAt(wrapper, 3, 4).trigger("click");
            await wrapper.find("[data-testid='number-7']").trigger("click");

            expect(cellAt(wrapper, 3, 4).text()).toBe("7");
        });

        it("should navigate back to Home when clicking Back button", async () => {
            const { wrapper, router } = mountWalkthrough();
            await router.push("/solver");
            await router.isReady();

            await wrapper.find("[data-testid='back-button']").trigger("click");
            await flushPromises();

            expect(router.currentRoute.value.path).toBe("/");
        });

        it("should select a digit when clicked without a selected cell", async () => {
            const { wrapper } = mountWalkthrough();

            await wrapper.find("[data-testid='number-5']").trigger("click");

            expect(wrapper.find("[data-testid='number-5']").classes()).toContain("bg-primary");
        });

        it("should fill clicked cell when a digit is already selected", async () => {
            const { wrapper } = mountWalkthrough();

            await wrapper.find("[data-testid='number-8']").trigger("click");
            await cellAt(wrapper, 2, 6).trigger("click");

            expect(cellAt(wrapper, 2, 6).text()).toBe("8");
        });

        it("should keep digit selected and fill subsequent clicked cells", async () => {
            const { wrapper } = mountWalkthrough();

            await wrapper.find("[data-testid='number-3']").trigger("click");
            await cellAt(wrapper, 0, 0).trigger("click");
            await cellAt(wrapper, 4, 4).trigger("click");

            expect(cellAt(wrapper, 0, 0).text()).toBe("3");
            expect(cellAt(wrapper, 4, 4).text()).toBe("3");
        });

        it("should deselect the digit when clicking the same digit again", async () => {
            const { wrapper } = mountWalkthrough();

            await wrapper.find("[data-testid='number-5']").trigger("click");
            expect(wrapper.find("[data-testid='number-5']").classes()).toContain("bg-primary");

            await wrapper.find("[data-testid='number-5']").trigger("click");
            expect(wrapper.find("[data-testid='number-5']").classes()).not.toContain("bg-primary");
        });

        it("should enter erase mode when clicking Erase button", async () => {
            const { wrapper } = mountWalkthrough();

            await wrapper.find("[data-testid='erase-button']").trigger("click");

            expect(wrapper.find("[data-testid='erase-button']").classes()).toContain("bg-primary");
        });

        it("should deselect the digit when entering erase mode", async () => {
            const { wrapper } = mountWalkthrough();

            await wrapper.find("[data-testid='number-5']").trigger("click");
            await wrapper.find("[data-testid='erase-button']").trigger("click");

            expect(wrapper.find("[data-testid='number-5']").classes()).not.toContain("bg-primary");
            expect(wrapper.find("[data-testid='erase-button']").classes()).toContain("bg-primary");
        });

        it("should exit erase mode when selecting a digit", async () => {
            const { wrapper } = mountWalkthrough();

            await wrapper.find("[data-testid='erase-button']").trigger("click");
            await wrapper.find("[data-testid='number-3']").trigger("click");

            expect(wrapper.find("[data-testid='erase-button']").classes()).not.toContain("bg-primary");
            expect(wrapper.find("[data-testid='number-3']").classes()).toContain("bg-primary");
        });

        it("should clear a filled cell when clicked in erase mode", async () => {
            const { wrapper } = mountWalkthrough();

            await wrapper.find("[data-testid='number-6']").trigger("click");
            await cellAt(wrapper, 5, 2).trigger("click");
            expect(cellAt(wrapper, 5, 2).text()).toBe("6");

            await wrapper.find("[data-testid='erase-button']").trigger("click");
            await cellAt(wrapper, 5, 2).trigger("click");

            expect(cellAt(wrapper, 5, 2).text()).toBe("");
        });

        it("should render a Solve button", () => {
            const { wrapper } = mountWalkthrough();

            expect(wrapper.find("[data-testid='solve-button']").exists()).toBe(true);
        });
    });

    describe("playback", () => {
        it("should keep the inputs in place under the panel", async () => {
            const { wrapper } = mountWalkthrough();
            await fillPuzzle(wrapper, singlesPuzzle);
            const board = wrapper.find("[data-testid='walkthrough-board']").element;
            expect(wrapper.find("[data-testid='walkthrough-inputs']").attributes("inert")).toBeUndefined();

            await solve(wrapper);

            const inputs = wrapper.find("[data-testid='walkthrough-inputs']");
            expect(inputs.exists()).toBe(true);
            expect(inputs.attributes("inert")).toBeDefined();
            expect(inputs.classes()).toContain("opacity-0");
            const panel = wrapper.find("[data-testid='walkthrough-panel']");
            expect(panel.element.parentElement?.classList.contains("absolute")).toBe(true);
            expect(wrapper.find("[data-testid='walkthrough-board']").element).toBe(board);
        });

        it("should ignore cell clicks after entering solve mode", async () => {
            const { wrapper } = mountWalkthrough();
            await fillPuzzle(wrapper, singlesPuzzle);

            await solve(wrapper);
            await cellAt(wrapper, 0, 0).trigger("click");

            expect(cellAt(wrapper, 0, 0).classes()).not.toContain("bg-cell-selected");
        });

        it("should not present the cells as buttons during playback", async () => {
            const { wrapper } = mountWalkthrough();
            await fillPuzzle(wrapper, singlesPuzzle);
            expect(cellAt(wrapper, 0, 0).attributes("role")).toBe("button");

            await solve(wrapper);

            expect(wrapper.findAll("[data-testid^='solver-cell-'][role='button']")).toHaveLength(0);
        });

        it("should return to edit mode and preserve puzzle when clicking Back during solve mode", async () => {
            const { wrapper } = mountWalkthrough();
            await fillPuzzle(wrapper, singlesPuzzle);

            await solve(wrapper);
            expect(wrapper.find("[data-testid='walkthrough-panel']").exists()).toBe(true);

            await wrapper.find("[data-testid='back-button']").trigger("click");

            expect(wrapper.find("[data-testid='walkthrough-panel']").exists()).toBe(false);
            expect(wrapper.find("[data-testid='walkthrough-inputs']").attributes("inert")).toBeUndefined();
            expect(wrapper.find("[data-testid='solve-button']").exists()).toBe(true);
            expect(cellAt(wrapper, 0, 3).find("[data-testid='cell-value']").text()).toBe("2");
        });

        it("should open on the first step", async () => {
            const { wrapper } = mountWalkthrough();
            await fillPuzzle(wrapper, singlesPuzzle);
            const { cell, digit } = firstSinglesStep().assignments[0];

            await solve(wrapper);

            expect(wrapper.find("[data-testid='walkthrough-technique']").text()).toBe("Naked Single");
            const explanation = wrapper.find("[data-testid='walkthrough-explanation']").text();
            expect(explanation).toContain(`Row ${cell.row + 1}, Col ${cell.column + 1}`);
            expect(explanation).toContain(String(digit));
            expect(wrapper.find("[data-testid='walkthrough-step-counter']").text()).toBe(`1 / ${singlesStepCount}`);
        });

        it("should mark the first step's answer cell like hint mode", async () => {
            const { wrapper } = mountWalkthrough();
            await fillPuzzle(wrapper, singlesPuzzle);
            const { cell, digit } = firstSinglesStep().assignments[0];

            await solve(wrapper);

            const answerCell = () => cellAt(wrapper, cell.row, cell.column);
            expect(answerCell().classes()).toContain("bg-primary-light");
            expect(answerCell().classes()).toContain("ring-primary");
            expect(answerCell().find("[data-testid='cell-value']").exists()).toBe(false);

            await clickNext(wrapper, 1);
            const value = answerCell().find("[data-testid='cell-value']");
            expect(value.text()).toBe(String(digit));
            expect(value.classes()).toContain("text-primary");

            await wrapper.find("[data-testid='walkthrough-previous']").trigger("click");
            expect(answerCell().find("[data-testid='cell-value']").exists()).toBe(false);
        });

        it("should show every empty cell's candidates before the step", async () => {
            const { wrapper } = mountWalkthrough();
            await fillPuzzle(wrapper, singlesPuzzle);
            const step = firstSinglesStep();
            const marked = new Set([
                ...step.scopes.flatMap(scopeCells),
                ...step.focus,
                ...step.assignments.map((assignment) => assignment.cell),
            ].map((cell) => `${cell.row}-${cell.column}`));

            await solve(wrapper);

            const state = BoardState.fromPuzzle(singlesPuzzle);
            let checked = 0;
            for (let row = 0; row < 9; row++) {
                for (let column = 0; column < 9; column++) {
                    if (singlesPuzzle[row][column] !== 0 || marked.has(`${row}-${column}`)) continue;
                    expect(cellAt(wrapper, row, column).text()).toBe(state.candidatesOf(row, column).join(""));
                    checked++;
                }
            }
            expect(checked).toBeGreaterThan(0);
        });

        it("should strike the candidates an elimination step removes", async () => {
            const { wrapper } = mountWalkthrough();
            await fillPuzzle(wrapper, hardPuzzle);
            const path = buildSolvePath(hardPuzzle);
            const index = path.findIndex((entry) => entry.step.assignments.length === 0);
            if (index === -1) throw new Error("expected an elimination step");

            await solve(wrapper);
            await clickNext(wrapper, index);

            const { eliminations } = path[index].step;
            expect(eliminations.length).toBeGreaterThan(0);
            for (const { cell, digit } of eliminations) {
                expect(cellAt(wrapper, cell.row, cell.column).find(`[data-testid='eliminated-note-${digit}']`).exists()).toBe(true);
            }
        });

        it("should apply scope variant to non-focus cells in the current step's scope", async () => {
            const { wrapper } = mountWalkthrough();
            await fillPuzzle(wrapper, mediumPuzzle);
            const path = buildSolvePath(mediumPuzzle);
            const index = path.findIndex((entry) => entry.step.scopes.length > 0);
            if (index === -1) throw new Error("expected at least one step with scope");
            const { step } = path[index];

            await solve(wrapper);
            await clickNext(wrapper, index);

            const markedKeys = new Set([
                ...step.focus,
                ...(step.supporters ?? []),
                ...step.assignments.map((assignment) => assignment.cell),
            ].map((cell) => `${cell.row}-${cell.column}`));
            let checkedScopeCells = 0;
            for (const cell of step.scopes.flatMap(scopeCells)) {
                if (markedKeys.has(`${cell.row}-${cell.column}`)) continue;
                expect(cellAt(wrapper, cell.row, cell.column).classes()).toContain("bg-cell-scope");
                checkedScopeCells++;
            }
            expect(checkedScopeCells).toBeGreaterThan(0);
        });

        it("should stop on the last step the solver found", async () => {
            const { wrapper } = mountWalkthrough();
            await fillPuzzle(wrapper, singlesPuzzle);
            const path = buildSolvePath(singlesPuzzle);
            const lastCell = path[path.length - 1].step.assignments[0].cell;

            await solve(wrapper);
            for (let guard = 0; guard < 200; guard++) {
                const next = wrapper.find("[data-testid='walkthrough-next']");
                if (next.attributes("disabled") !== undefined) break;
                await next.trigger("click");
            }

            for (let row = 0; row < 9; row++) {
                for (let column = 0; column < 9; column++) {
                    const value = cellAt(wrapper, row, column).find("[data-testid='cell-value']");
                    if (row === lastCell.row && column === lastCell.column) {
                        expect(value.exists()).toBe(false);
                    } else {
                        expect(value.text()).toBe(String(singlesSolution[row][column]));
                    }
                }
            }
            expect(wrapper.find("[data-testid='walkthrough-progress-fill']").attributes("style")).toContain("width: 100%");
        });

        it("should auto-advance steps every 800ms when Play is active", async () => {
            vi.useFakeTimers({ shouldAdvanceTime: true });
            const { wrapper } = mountWalkthrough();
            await fillPuzzle(wrapper, singlesPuzzle);

            await solve(wrapper);
            const counter = () => wrapper.find("[data-testid='walkthrough-step-counter']").text();
            expect(counter()).toBe(`1 / ${singlesStepCount}`);

            await wrapper.find("[data-testid='walkthrough-play']").trigger("click");

            await vi.advanceTimersByTimeAsync(800);
            expect(counter()).toBe(`2 / ${singlesStepCount}`);

            await vi.advanceTimersByTimeAsync(800);
            expect(counter()).toBe(`3 / ${singlesStepCount}`);
        });

        it("should stop auto-play when going back to edit", async () => {
            vi.useFakeTimers({ shouldAdvanceTime: true });
            const { wrapper } = mountWalkthrough();
            await fillPuzzle(wrapper, singlesPuzzle);

            await solve(wrapper);
            await wrapper.find("[data-testid='walkthrough-play']").trigger("click");
            await wrapper.find("[data-testid='back-button']").trigger("click");
            await vi.advanceTimersByTimeAsync(2000);

            expect(wrapper.find("[data-testid='walkthrough-panel']").exists()).toBe(false);

            await solve(wrapper);
            expect(wrapper.find("[data-testid='walkthrough-step-counter']").text()).toBe(`1 / ${singlesStepCount}`);
        });

        it("should start from the first step after solving again", async () => {
            const { wrapper } = mountWalkthrough();
            await fillPuzzle(wrapper, singlesPuzzle);

            await solve(wrapper);
            await clickNext(wrapper, 4);
            expect(wrapper.find("[data-testid='walkthrough-step-counter']").text()).toBe(`5 / ${singlesStepCount}`);
            await wrapper.find("[data-testid='back-button']").trigger("click");
            await solve(wrapper);

            expect(wrapper.find("[data-testid='walkthrough-step-counter']").text()).toBe(`1 / ${singlesStepCount}`);
        });
    });

    describe("reset", () => {
        const enterSeven = async (wrapper: VueWrapper) => {
            await cellAt(wrapper, 3, 4).trigger("click");
            await wrapper.find("[data-testid='number-7']").trigger("click");
        };

        it("should make reset a quiet text button", async () => {
            const { wrapper } = mountWalkthrough();
            const reset = () => wrapper.find("[data-testid='reset-button']");

            expect(reset().classes()).toContain("text-foreground-secondary");
            expect(reset().classes()).not.toContain("bg-danger");
            expect(reset().attributes("disabled")).toBeDefined();

            await enterSeven(wrapper);

            expect(reset().attributes("disabled")).toBeUndefined();
        });

        it("should ask before clearing the board", async () => {
            const { wrapper } = mountWalkthrough();
            await enterSeven(wrapper);

            await wrapper.find("[data-testid='reset-button']").trigger("click");

            expect(wrapper.find("[data-testid='walkthrough-dialog-message']").text()).toBe("Every digit you entered will be removed.");
            expect(cellAt(wrapper, 3, 4).text()).toBe("7");
        });

        it("should keep the puzzle when reset is cancelled", async () => {
            const { wrapper } = mountWalkthrough();
            await enterSeven(wrapper);

            await wrapper.find("[data-testid='reset-button']").trigger("click");
            await wrapper.find("[data-testid='walkthrough-dialog-cancel']").trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-testid='walkthrough-dialog']").exists()).toBe(false);
            expect(cellAt(wrapper, 3, 4).text()).toBe("7");
        });

        it("should clear the board when reset is confirmed", async () => {
            const { wrapper } = mountWalkthrough();
            await enterSeven(wrapper);

            await wrapper.find("[data-testid='reset-button']").trigger("click");
            await wrapper.find("[data-testid='walkthrough-dialog-confirm']").trigger("click");
            await flushPromises();

            expect(cellAt(wrapper, 3, 4).text()).toBe("");
            expect(wrapper.find("[data-testid='reset-button']").attributes("disabled")).toBeDefined();
        });

        it("should ask in Traditional Chinese", async () => {
            i18n.global.locale.value = "zh-Hant";
            await nextTick();
            const { wrapper } = mountWalkthrough();
            await enterSeven(wrapper);

            await wrapper.find("[data-testid='reset-button']").trigger("click");

            expect(wrapper.find("[data-testid='walkthrough-dialog-title']").text()).toBe("清空盤面？");
        });
    });

    describe("in Traditional Chinese", () => {
        it("should name the technique and the cell, and keep the button labels", async () => {
            i18n.global.locale.value = "zh-Hant";
            await nextTick();
            const { wrapper } = mountWalkthrough();
            await fillPuzzle(wrapper, singlesPuzzle);

            expect(wrapper.find("[data-testid='reset-button']").text()).toBe("重設");
            expect(wrapper.find("[data-testid='solve-button']").text()).toBe("解題");

            await solve(wrapper);

            expect(wrapper.find("[data-testid='walkthrough-technique']").text()).toBe("唯一候選數");
            const explanation = wrapper.find("[data-testid='walkthrough-explanation']").text();
            expect(explanation).toContain("第");
            expect(explanation).toContain("列");
        });
    });
});
