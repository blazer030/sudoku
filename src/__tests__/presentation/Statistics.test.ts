import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia, getActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import Statistics from "@/presentation/pages/statistics/Statistics.vue";
import { useStatisticsStore, type RecordGameInput } from "@/stores/statisticsStore";
import { i18n } from "@/presentation/i18n";

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
    const pinia = getActivePinia();
    if (pinia === undefined) throw new Error("pinia not active");
    const wrapper = mount(Statistics, {
        global: { plugins: [router, pinia] },
    });
    return { wrapper, router };
};

const recordGames = (games: RecordGameInput[]) => {
    const store = useStatisticsStore();
    games.forEach((game) => { store.recordGame(game); });
};

beforeEach(() => {
    setActivePinia(createPinia());
});

afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
});

describe("Statistics", () => {
    it("should show Traditional Chinese labels and dates when the language is zh-Hant", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 9, 21, 15, 5));
        recordGames([{ difficulty: "hard", elapsedSeconds: 500, completed: false }]);
        const { wrapper } = mountStatistics();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        const text = wrapper.text();
        for (const label of ["統計", "總覽", "連續遊玩天數", "最佳時間", "最近遊戲", "已放棄", "困難", "今天 15:05"]) {
            expect(text).toContain(label);
        }
        expect(text).not.toContain("Gave up");
    });

    it("should keep overview card padding tight so the longest zh label fits on one line", () => {
        recordGames([{ difficulty: "easy", elapsedSeconds: 100, completed: true }]);
        const { wrapper } = mountStatistics();

        for (const testid of ["games-won", "win-rate", "day-streak"]) {
            expect(wrapper.find(`[data-testid='${testid}']`).classes()).toContain("px-2");
        }
        expect(wrapper.find("[data-testid='day-streak'] span:last-child").classes()).toContain("text-center");
    });

    it("should display overview cards with games won, win rate, and day streak", () => {
        recordGames([
            { difficulty: "easy", elapsedSeconds: 120, completed: true },
            { difficulty: "medium", elapsedSeconds: 200, completed: false },
        ]);

        const { wrapper } = mountStatistics();

        expect(wrapper.find("[data-testid='games-won']").text()).toContain("1");
        expect(wrapper.find("[data-testid='win-rate']").text()).toContain("50%");
    });

    it("should display best times per difficulty", () => {
        recordGames([
            { difficulty: "easy", elapsedSeconds: 263, completed: true },
            { difficulty: "easy", elapsedSeconds: 300, completed: true },
            { difficulty: "medium", elapsedSeconds: 512, completed: true },
        ]);

        const { wrapper } = mountStatistics();

        expect(wrapper.find("[data-testid='best-time-easy']").text()).toContain("04:23");
        expect(wrapper.find("[data-testid='best-time-medium']").text()).toContain("08:32");
        expect(wrapper.find("[data-testid='best-time-hard']").text()).toContain("--:--");
    });

    it("should display recent games list", () => {
        recordGames([
            { difficulty: "easy", elapsedSeconds: 332, completed: true },
            { difficulty: "hard", elapsedSeconds: 500, completed: false },
        ]);

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
        recordGames([{ difficulty: "easy", elapsedSeconds: 120, completed: true, hintsUsed: 2 }]);

        const { wrapper } = mountStatistics();

        const games = wrapper.findAll("[data-testid='recent-game']");
        expect(games[0].find("[data-testid='hints-used']").text()).toContain("2");
    });

    it("should display 0 hints for entries without hintsUsed", () => {
        recordGames([{ difficulty: "easy", elapsedSeconds: 100, completed: true }]);

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

    it("should not offer clearing records", () => {
        recordGames([{ difficulty: "easy", elapsedSeconds: 120, completed: true }]);
        const { wrapper } = mountStatistics();

        expect(wrapper.find("[data-testid='clear-records-button']").exists()).toBe(false);
    });
});
