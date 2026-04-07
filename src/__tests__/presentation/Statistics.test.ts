import { afterEach, describe, expect, it } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import Statistics from "@/presentation/pages/statistics/Statistics.vue";
import { recordGameResult, getGameHistory } from "@/application/Statistics";

const createTestRouter = () => {
    return createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/statistics", component: Statistics },
            { path: "/", component: { template: "<div>Home</div>" } },
        ],
    });
};

const mountStatistics = () => {
    const router = createTestRouter();
    const pinia = createPinia();
    const wrapper = mount(Statistics, {
        global: { plugins: [router, pinia] },
    });
    return { wrapper, router };
};

afterEach(() => {
    localStorage.clear();
});

describe("Statistics", () => {
    it("should display overview cards with games won, win rate, and day streak", () => {
        recordGameResult({ difficulty: "easy", elapsedSeconds: 120, completed: true });
        recordGameResult({ difficulty: "medium", elapsedSeconds: 200, completed: false });

        const { wrapper } = mountStatistics();

        expect(wrapper.find("[data-testid='games-won']").text()).toContain("1");
        expect(wrapper.find("[data-testid='win-rate']").text()).toContain("50%");
    });

    it("should display best times per difficulty", () => {
        recordGameResult({ difficulty: "easy", elapsedSeconds: 263, completed: true });
        recordGameResult({ difficulty: "easy", elapsedSeconds: 300, completed: true });
        recordGameResult({ difficulty: "medium", elapsedSeconds: 512, completed: true });

        const { wrapper } = mountStatistics();

        expect(wrapper.find("[data-testid='best-time-easy']").text()).toContain("04:23");
        expect(wrapper.find("[data-testid='best-time-medium']").text()).toContain("08:32");
        expect(wrapper.find("[data-testid='best-time-hard']").text()).toContain("--:--");
    });

    it("should display recent games list", () => {
        recordGameResult({ difficulty: "easy", elapsedSeconds: 332, completed: true });
        recordGameResult({ difficulty: "hard", elapsedSeconds: 500, completed: false });

        const { wrapper } = mountStatistics();

        const games = wrapper.findAll("[data-testid='recent-game']");
        expect(games).toHaveLength(2);
        expect(games[0].text()).toContain("Hard");
        expect(games[0].text()).toContain("Gave up");
        expect(games[1].text()).toContain("Easy");
        expect(games[1].text()).toContain("05:32");
    });

    it("should navigate back to home when clicking Back", async () => {
        const { wrapper, router } = mountStatistics();
        await router.push("/statistics");
        await router.isReady();

        await wrapper.find("[data-testid='stats-back-button']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe("/");
    });

    it("should display hintsUsed in recent games", () => {
        recordGameResult({ difficulty: "easy", elapsedSeconds: 120, completed: true, hintsUsed: 2 });

        const { wrapper } = mountStatistics();

        const games = wrapper.findAll("[data-testid='recent-game']");
        expect(games[0].find("[data-testid='hints-used']").text()).toContain("2");
    });

    it("should display 0 hints for old records without hintsUsed", () => {
        // 模擬舊資料
        localStorage.setItem("sudoku-statistics", JSON.stringify([
            { difficulty: "easy", elapsedSeconds: 100, completed: true, date: "2024-01-01" },
        ]));

        const { wrapper } = mountStatistics();

        const games = wrapper.findAll("[data-testid='recent-game']");
        expect(games[0].find("[data-testid='hints-used']").text()).toContain("0");
    });

    it("should show empty state when no games played", () => {
        const { wrapper } = mountStatistics();

        expect(wrapper.find("[data-testid='games-won']").text()).toContain("0");
        expect(wrapper.find("[data-testid='win-rate']").text()).toContain("0%");
        expect(wrapper.find("[data-testid='best-time-easy']").text()).toContain("--:--");
        expect(wrapper.findAll("[data-testid='recent-game']")).toHaveLength(0);
    });

    it("should show clear records dialog when clicking Clear All Records button", async () => {
        const { wrapper } = mountStatistics();

        await wrapper.find("[data-testid='clear-records-button']").trigger("click");

        expect(wrapper.find("[data-testid='clear-records-dialog']").exists()).toBe(true);
    });

    it("should clear all records when confirming in dialog", async () => {
        recordGameResult({ difficulty: "easy", elapsedSeconds: 120, completed: true });

        const { wrapper } = mountStatistics();

        await wrapper.find("[data-testid='clear-records-button']").trigger("click");
        await wrapper.find("[data-testid='clear-records-confirm-button']").trigger("click");
        await flushPromises();

        expect(getGameHistory()).toHaveLength(0);
    });

    it("should keep records when cancelling in dialog", async () => {
        recordGameResult({ difficulty: "easy", elapsedSeconds: 120, completed: true });

        const { wrapper } = mountStatistics();

        await wrapper.find("[data-testid='clear-records-button']").trigger("click");
        await wrapper.find("[data-testid='clear-records-cancel-button']").trigger("click");
        await flushPromises();

        expect(getGameHistory()).toHaveLength(1);
    });
});
