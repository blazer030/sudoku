import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import SolverWalkthrough from "@/presentation/pages/solver-walkthrough/SolverWalkthrough.vue";
import { BoardState } from "@/domain/solver/BoardState";
import { TechniqueSolver } from "@/domain/solver/TechniqueSolver";
import { singlesPuzzle, singlesSolution } from "@/__tests__/fixtures/singlesPuzzle";

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

afterEach(() => {
    vi.useRealTimers();
});

describe("SolverWalkthrough", () => {
    it("should render a 9x9 board on mount", () => {
        const { wrapper } = mountWalkthrough();

        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                const cell = wrapper.find(`[data-testid='solver-cell-${row}-${column}']`);
                expect(cell.exists()).toBe(true);
            }
        }
    });

    it("should show all 1-9 candidate notes in empty cells by default", () => {
        const { wrapper } = mountWalkthrough();

        const cell = wrapper.find("[data-testid='solver-cell-0-0']");
        expect(cell.text()).toBe("123456789");
    });

    it("should remove filled digit from candidate notes of peer cells", async () => {
        const { wrapper } = mountWalkthrough();

        await wrapper.find("[data-testid='number-9']").trigger("click");
        await wrapper.find("[data-testid='solver-cell-0-0']").trigger("click");

        expect(wrapper.find("[data-testid='solver-cell-0-1']").text()).toBe("12345678");
        expect(wrapper.find("[data-testid='solver-cell-1-0']").text()).toBe("12345678");
        expect(wrapper.find("[data-testid='solver-cell-2-2']").text()).toBe("12345678");
        expect(wrapper.find("[data-testid='solver-cell-3-3']").text()).toBe("123456789");
    });

    it("should restore candidate notes on peer cells after erasing", async () => {
        const { wrapper } = mountWalkthrough();

        await wrapper.find("[data-testid='number-9']").trigger("click");
        await wrapper.find("[data-testid='solver-cell-0-0']").trigger("click");
        expect(wrapper.find("[data-testid='solver-cell-0-1']").text()).toBe("12345678");

        await wrapper.find("[data-testid='number-9']").trigger("click");
        await wrapper.find("[data-testid='erase-button']").trigger("click");
        await wrapper.find("[data-testid='solver-cell-0-0']").trigger("click");

        expect(wrapper.find("[data-testid='solver-cell-0-1']").text()).toBe("123456789");
        expect(wrapper.find("[data-testid='solver-cell-1-0']").text()).toBe("123456789");
    });

    it("should reject filling a digit not in the cell's candidates", async () => {
        const { wrapper } = mountWalkthrough();

        await wrapper.find("[data-testid='number-9']").trigger("click");
        await wrapper.find("[data-testid='solver-cell-0-0']").trigger("click");

        await wrapper.find("[data-testid='solver-cell-0-1']").trigger("click");

        expect(wrapper.find("[data-testid='solver-cell-0-1']").text()).toBe("12345678");
    });

    it("should fill selected cell when a digit is picked", async () => {
        const { wrapper } = mountWalkthrough();

        await wrapper.find("[data-testid='solver-cell-3-4']").trigger("click");
        await wrapper.find("[data-testid='number-7']").trigger("click");

        expect(wrapper.find("[data-testid='solver-cell-3-4']").text()).toBe("7");
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
        await wrapper.find("[data-testid='solver-cell-2-6']").trigger("click");

        expect(wrapper.find("[data-testid='solver-cell-2-6']").text()).toBe("8");
    });

    it("should keep digit selected and fill subsequent clicked cells", async () => {
        const { wrapper } = mountWalkthrough();

        await wrapper.find("[data-testid='number-3']").trigger("click");
        await wrapper.find("[data-testid='solver-cell-0-0']").trigger("click");
        await wrapper.find("[data-testid='solver-cell-4-4']").trigger("click");

        expect(wrapper.find("[data-testid='solver-cell-0-0']").text()).toBe("3");
        expect(wrapper.find("[data-testid='solver-cell-4-4']").text()).toBe("3");
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
        expect(wrapper.find("[data-testid='number-5']").classes()).toContain("bg-primary");

        await wrapper.find("[data-testid='erase-button']").trigger("click");

        expect(wrapper.find("[data-testid='number-5']").classes()).not.toContain("bg-primary");
        expect(wrapper.find("[data-testid='erase-button']").classes()).toContain("bg-primary");
    });

    it("should exit erase mode when selecting a digit", async () => {
        const { wrapper } = mountWalkthrough();

        await wrapper.find("[data-testid='erase-button']").trigger("click");
        expect(wrapper.find("[data-testid='erase-button']").classes()).toContain("bg-primary");

        await wrapper.find("[data-testid='number-3']").trigger("click");

        expect(wrapper.find("[data-testid='erase-button']").classes()).not.toContain("bg-primary");
        expect(wrapper.find("[data-testid='number-3']").classes()).toContain("bg-primary");
    });

    it("should clear a filled cell when clicked in erase mode", async () => {
        const { wrapper } = mountWalkthrough();

        await wrapper.find("[data-testid='number-6']").trigger("click");
        await wrapper.find("[data-testid='solver-cell-5-2']").trigger("click");
        expect(wrapper.find("[data-testid='solver-cell-5-2']").text()).toBe("6");

        await wrapper.find("[data-testid='number-6']").trigger("click");
        await wrapper.find("[data-testid='erase-button']").trigger("click");
        await wrapper.find("[data-testid='solver-cell-5-2']").trigger("click");

        expect(wrapper.find("[data-testid='solver-cell-5-2']").text()).toBe("123456789");
    });

    it("should render a Solve button", () => {
        const { wrapper } = mountWalkthrough();

        expect(wrapper.find("[data-testid='solve-button']").exists()).toBe(true);
    });

    it("should hide DigitPad after clicking Solve", async () => {
        const { wrapper } = mountWalkthrough();
        expect(wrapper.find("[data-testid='number-1']").exists()).toBe(true);

        await wrapper.find("[data-testid='solve-button']").trigger("click");

        expect(wrapper.find("[data-testid='number-1']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='erase-button']").exists()).toBe(false);
    });

    it("should ignore cell clicks after entering solve mode", async () => {
        const { wrapper } = mountWalkthrough();

        await wrapper.find("[data-testid='solve-button']").trigger("click");
        await wrapper.find("[data-testid='solver-cell-0-0']").trigger("click");

        expect(wrapper.find("[data-testid='solver-cell-0-0']").classes()).not.toContain("bg-primary-light");
    });

    it("should return to edit mode and preserve puzzle when clicking Edit", async () => {
        const { wrapper } = mountWalkthrough();
        await fillPuzzle(wrapper, singlesPuzzle);

        await wrapper.find("[data-testid='solve-button']").trigger("click");
        expect(wrapper.find("[data-testid='number-1']").exists()).toBe(false);

        await wrapper.find("[data-testid='edit-button']").trigger("click");

        expect(wrapper.find("[data-testid='number-1']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='solve-button']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='next-step-button']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='solver-cell-0-3']").find("[data-testid='cell-value']").text()).toBe("2");
    });

    it("should reveal step navigation buttons after clicking Solve", async () => {
        const { wrapper } = mountWalkthrough();

        expect(wrapper.find("[data-testid='next-step-button']").exists()).toBe(false);

        await wrapper.find("[data-testid='solve-button']").trigger("click");

        expect(wrapper.find("[data-testid='next-step-button']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='prev-step-button']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='first-step-button']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='last-step-button']").exists()).toBe(true);
    });

    it("should apply the first solver step to the board when clicking Next", async () => {
        const { wrapper } = mountWalkthrough();
        await fillPuzzle(wrapper, singlesPuzzle);

        const firstStep = new TechniqueSolver().nextStep(BoardState.fromPuzzle(singlesPuzzle));
        if (firstStep === null) throw new Error("expected first step to exist");
        const { cell, digit } = firstStep.assignments[0];
        const targetSelector = `[data-testid='solver-cell-${cell.row}-${cell.column}']`;

        await wrapper.find("[data-testid='solve-button']").trigger("click");
        expect(wrapper.find(targetSelector).find("[data-testid='cell-value']").exists()).toBe(false);

        await wrapper.find("[data-testid='next-step-button']").trigger("click");
        expect(wrapper.find(targetSelector).find("[data-testid='cell-value']").text()).toBe(String(digit));
    });

    it("should reverse the last applied step when clicking Prev", async () => {
        const { wrapper } = mountWalkthrough();
        await fillPuzzle(wrapper, singlesPuzzle);

        const firstStep = new TechniqueSolver().nextStep(BoardState.fromPuzzle(singlesPuzzle));
        if (firstStep === null) throw new Error("expected first step to exist");
        const { cell } = firstStep.assignments[0];
        const targetSelector = `[data-testid='solver-cell-${cell.row}-${cell.column}']`;

        await wrapper.find("[data-testid='solve-button']").trigger("click");
        await wrapper.find("[data-testid='next-step-button']").trigger("click");
        expect(wrapper.find(targetSelector).find("[data-testid='cell-value']").exists()).toBe(true);

        await wrapper.find("[data-testid='prev-step-button']").trigger("click");
        expect(wrapper.find(targetSelector).find("[data-testid='cell-value']").exists()).toBe(false);
    });

    it("should jump to fully solved state when clicking Last", async () => {
        const { wrapper } = mountWalkthrough();
        await fillPuzzle(wrapper, singlesPuzzle);

        await wrapper.find("[data-testid='solve-button']").trigger("click");
        await wrapper.find("[data-testid='last-step-button']").trigger("click");

        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                const cellValue = wrapper.find(`[data-testid='solver-cell-${row}-${column}']`).find("[data-testid='cell-value']");
                expect(cellValue.text()).toBe(String(singlesSolution[row][column]));
            }
        }
    });

    it("should show an 'Initial board' description before any step is applied", async () => {
        const { wrapper } = mountWalkthrough();
        await fillPuzzle(wrapper, singlesPuzzle);

        await wrapper.find("[data-testid='solve-button']").trigger("click");

        expect(wrapper.find("[data-testid='step-description']").text()).toContain("Initial board");
    });

    it("should highlight focus cell at the current solver step", async () => {
        const { wrapper } = mountWalkthrough();
        await fillPuzzle(wrapper, singlesPuzzle);

        const firstStep = new TechniqueSolver().nextStep(BoardState.fromPuzzle(singlesPuzzle));
        if (firstStep === null) throw new Error("expected first step to exist");
        const { cell } = firstStep.assignments[0];

        await wrapper.find("[data-testid='solve-button']").trigger("click");
        await wrapper.find("[data-testid='next-step-button']").trigger("click");

        const focusCell = wrapper.find(`[data-testid='solver-cell-${cell.row}-${cell.column}']`);
        expect(focusCell.classes()).toContain("bg-primary-light");

        const nonFocus = cell.row === 0 && cell.column === 0
            ? `[data-testid='solver-cell-0-1']`
            : `[data-testid='solver-cell-0-0']`;
        expect(wrapper.find(nonFocus).classes()).not.toContain("bg-primary-light");
    });

    it("should fill progress bar to 100% when at the final step", async () => {
        const { wrapper } = mountWalkthrough();
        await fillPuzzle(wrapper, singlesPuzzle);

        await wrapper.find("[data-testid='solve-button']").trigger("click");
        expect(wrapper.find("[data-testid='progress-fill']").attributes("style")).toContain("width: 0%");

        await wrapper.find("[data-testid='last-step-button']").trigger("click");
        expect(wrapper.find("[data-testid='progress-fill']").attributes("style")).toContain("width: 100%");
    });

    it("should auto-advance steps every 800ms when Play is active", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const { wrapper } = mountWalkthrough();
        await fillPuzzle(wrapper, singlesPuzzle);

        await wrapper.find("[data-testid='solve-button']").trigger("click");
        expect(wrapper.find("[data-testid='step-counter']").text()).toMatch(/Step 0 /);

        await wrapper.find("[data-testid='play-button']").trigger("click");

        await vi.advanceTimersByTimeAsync(800);
        expect(wrapper.find("[data-testid='step-counter']").text()).toMatch(/Step 1 /);

        await vi.advanceTimersByTimeAsync(800);
        expect(wrapper.find("[data-testid='step-counter']").text()).toMatch(/Step 2 /);
    });

    it("should show a 'Step N of M' counter that advances with Next", async () => {
        const { wrapper } = mountWalkthrough();
        await fillPuzzle(wrapper, singlesPuzzle);

        await wrapper.find("[data-testid='solve-button']").trigger("click");
        expect(wrapper.find("[data-testid='step-counter']").text()).toMatch(/Step 0 of \d+/);

        await wrapper.find("[data-testid='next-step-button']").trigger("click");
        expect(wrapper.find("[data-testid='step-counter']").text()).toMatch(/Step 1 of \d+/);
    });

    it("should describe a Naked Single step with technique, cell and digit", async () => {
        const { wrapper } = mountWalkthrough();
        await fillPuzzle(wrapper, singlesPuzzle);

        const firstStep = new TechniqueSolver().nextStep(BoardState.fromPuzzle(singlesPuzzle));
        if (firstStep === null) throw new Error("expected first step to exist");
        expect(firstStep.technique).toBe("nakedSingle");
        const { cell, digit } = firstStep.assignments[0];

        await wrapper.find("[data-testid='solve-button']").trigger("click");
        await wrapper.find("[data-testid='next-step-button']").trigger("click");

        const text = wrapper.find("[data-testid='step-description']").text();
        expect(text).toContain("Naked Single");
        expect(text).toContain(`Row ${cell.row + 1}`);
        expect(text).toContain(`Col ${cell.column + 1}`);
        expect(text).toContain(String(digit));
    });

    it("should jump back to initial input state when clicking First", async () => {
        const { wrapper } = mountWalkthrough();
        await fillPuzzle(wrapper, singlesPuzzle);

        await wrapper.find("[data-testid='solve-button']").trigger("click");
        await wrapper.find("[data-testid='last-step-button']").trigger("click");
        await wrapper.find("[data-testid='first-step-button']").trigger("click");

        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                const puzzleDigit = singlesPuzzle[row][column];
                const cellValue = wrapper.find(`[data-testid='solver-cell-${row}-${column}']`).find("[data-testid='cell-value']");
                if (puzzleDigit === 0) {
                    expect(cellValue.exists()).toBe(false);
                } else {
                    expect(cellValue.text()).toBe(String(puzzleDigit));
                }
            }
        }
    });
});
