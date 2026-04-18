import { describe, expect, it } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import SolverWalkthrough from "@/presentation/pages/solver-walkthrough/SolverWalkthrough.vue";

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

describe("SolverWalkthrough", () => {
    it("should render an empty 9x9 board on mount", () => {
        const { wrapper } = mountWalkthrough();

        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                const cell = wrapper.find(`[data-testid='solver-cell-${row}-${column}']`);
                expect(cell.exists()).toBe(true);
                expect(cell.text()).toBe("");
            }
        }
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
});
