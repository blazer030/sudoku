import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia, getActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import Statistics from "@/presentation/pages/statistics/Statistics.vue";
import { useStatisticsStore, type RecordGameInput } from "@/stores/statisticsStore";
import { i18n } from "@/presentation/i18n";
import { formatTime } from "@/utils/formatTime";

const createTestRouter = () => {
    return createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/statistics", component: Statistics },
            { path: "/", component: { template: "<div>Home</div>" } },
            { path: "/game-review/:index", component: { template: "<div>Review</div>" } },
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

const recordEasyGames = (count: number) => {
    recordGames(Array.from({ length: count }, (_, number) => ({
        difficulty: "easy" as const,
        elapsedSeconds: 100 + number,
        completed: true,
    })));
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
        for (const label of ["統計", "總覽", "連續遊玩天數", "各難度", "最佳", "平均", "完成", "最近遊戲", "已放棄", "困難", "今天 15:05"]) {
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

    it("should count a day with only a given-up game in the streak", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 9, 21, 20, 0));
        recordGames([{ difficulty: "easy", elapsedSeconds: 100, completed: false }]);
        vi.setSystemTime(new Date(2026, 9, 22, 9, 0));
        recordGames([{ difficulty: "hard", elapsedSeconds: 100, completed: false }]);

        const { wrapper } = mountStatistics();

        expect(wrapper.find("[data-testid='day-streak']").text()).toContain("2");
    });

    it("should show best, average and completed games per difficulty", () => {
        recordGames([
            { difficulty: "easy", elapsedSeconds: 263, completed: true },
            { difficulty: "easy", elapsedSeconds: 300, completed: true },
            { difficulty: "easy", elapsedSeconds: 999, completed: false },
        ]);

        const { wrapper } = mountStatistics();

        expect(wrapper.find("[data-testid='difficulty-best-easy']").text()).toContain("04:23");
        expect(wrapper.find("[data-testid='difficulty-average-easy']").text()).toContain("04:42");
        expect(wrapper.find("[data-testid='difficulty-completed-easy']").text()).toContain("2/3");
    });

    it("should show the rounded average", () => {
        recordGames([
            { difficulty: "easy", elapsedSeconds: 100, completed: true },
            { difficulty: "easy", elapsedSeconds: 51, completed: true },
        ]);

        const { wrapper } = mountStatistics();

        const average = wrapper.find("[data-testid='difficulty-average-easy']").text();
        expect(average).toContain("01:16");
        expect(average).not.toContain(".");
    });

    it("should show a dash when a difficulty has no win", () => {
        recordGames([{ difficulty: "medium", elapsedSeconds: 400, completed: false }]);

        const { wrapper } = mountStatistics();

        expect(wrapper.find("[data-testid='difficulty-best-medium']").text()).toContain("—");
        expect(wrapper.find("[data-testid='difficulty-average-medium']").text()).toContain("—");
        expect(wrapper.find("[data-testid='difficulty-completed-medium']").text()).toContain("0/1");
    });

    it("should say a difficulty was not played yet", () => {
        recordGames([{ difficulty: "easy", elapsedSeconds: 100, completed: true }]);

        const { wrapper } = mountStatistics();

        const hard = wrapper.find("[data-testid='difficulty-stats-hard']");
        expect(hard.text()).toContain("Hard");
        expect(hard.text()).toContain("Not played yet");
        expect(wrapper.find("[data-testid='difficulty-best-hard']").exists()).toBe(false);
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

    it("should show the newest 20 games and more on request", async () => {
        recordEasyGames(45);
        const { wrapper } = mountStatistics();

        expect(wrapper.findAll("[data-testid='recent-game']")).toHaveLength(20);
        expect(wrapper.findAll("[data-testid='recent-game']")[0].text()).toContain(formatTime(144));

        await wrapper.find("[data-testid='show-more-button']").trigger("click");
        expect(wrapper.findAll("[data-testid='recent-game']")).toHaveLength(40);

        await wrapper.find("[data-testid='show-more-button']").trigger("click");
        expect(wrapper.findAll("[data-testid='recent-game']")).toHaveLength(45);
        expect(wrapper.find("[data-testid='show-more-button']").exists()).toBe(false);
    });

    it("should not offer more when exactly 20 games exist", () => {
        recordEasyGames(20);
        const { wrapper } = mountStatistics();

        expect(wrapper.findAll("[data-testid='recent-game']")).toHaveLength(20);
        expect(wrapper.find("[data-testid='show-more-button']").exists()).toBe(false);
    });

    it("should filter recent games by difficulty", async () => {
        recordGames([
            { difficulty: "easy", elapsedSeconds: 100, completed: true },
            { difficulty: "hard", elapsedSeconds: 200, completed: true },
            { difficulty: "easy", elapsedSeconds: 300, completed: true },
        ]);
        const { wrapper } = mountStatistics();

        expect(wrapper.find("[data-testid='recent-filter-all']").attributes("aria-pressed")).toBe("true");

        await wrapper.find("[data-testid='recent-filter-easy']").trigger("click");
        const games = wrapper.findAll("[data-testid='recent-game']");
        expect(games).toHaveLength(2);
        for (const item of games) {
            expect(item.text()).toContain("Easy");
        }
    });

    it("should start from 20 again after switching filters", async () => {
        recordGames(Array.from({ length: 60 }, (_, number) => ({
            difficulty: number % 2 === 0 ? "easy" as const : "hard" as const,
            elapsedSeconds: 100 + number,
            completed: true,
        })));
        const { wrapper } = mountStatistics();

        await wrapper.find("[data-testid='show-more-button']").trigger("click");
        expect(wrapper.findAll("[data-testid='recent-game']")).toHaveLength(40);

        await wrapper.find("[data-testid='recent-filter-hard']").trigger("click");
        expect(wrapper.findAll("[data-testid='recent-game']")).toHaveLength(20);

        await wrapper.find("[data-testid='recent-filter-all']").trigger("click");
        expect(wrapper.findAll("[data-testid='recent-game']")).toHaveLength(20);
    });

    it("should say when a difficulty has no games yet", async () => {
        recordEasyGames(3);
        const { wrapper } = mountStatistics();

        await wrapper.find("[data-testid='recent-filter-hard']").trigger("click");

        expect(wrapper.find("[data-testid='recent-games-empty']").text()).toBe("No games at this difficulty yet");
        expect(wrapper.find("[data-testid='recent-game']").exists()).toBe(false);
    });

    it("should open the review of the tapped game while filtered", async () => {
        const replay = { initialBoard: [], steps: [] };
        recordGames([
            { difficulty: "easy", elapsedSeconds: 100, completed: true, replay },
            { difficulty: "hard", elapsedSeconds: 200, completed: true, replay },
            { difficulty: "easy", elapsedSeconds: 300, completed: true, replay },
        ]);
        const { wrapper, router } = mountStatistics();

        await wrapper.find("[data-testid='recent-filter-hard']").trigger("click");
        await wrapper.find("[data-testid='recent-game']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe("/game-review/1");
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

    it("should show no numbers before the first game", () => {
        const { wrapper } = mountStatistics();

        for (const selector of [
            "[data-testid='games-won']",
            "[data-testid='win-rate']",
            "[data-testid='day-streak']",
            "[data-testid^='difficulty-stats-']",
            "[data-testid='recent-games-filter']",
        ]) {
            expect(wrapper.find(selector).exists()).toBe(false);
        }
        expect(wrapper.text()).not.toMatch(/\d/);
        const emptyState = wrapper.find("[data-testid='empty-state']");
        expect(emptyState.text()).toContain("No games played yet");
        expect(emptyState.text()).toContain("Play Your First Game");
    });

    it("should go home from the first game button", async () => {
        const { wrapper, router } = mountStatistics();
        await router.push("/statistics");
        await router.isReady();

        await wrapper.find("[data-testid='start-first-game-button']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe("/");
    });

    it("should hide the empty state once a game is recorded", () => {
        recordGames([{ difficulty: "easy", elapsedSeconds: 100, completed: true }]);
        const { wrapper } = mountStatistics();

        expect(wrapper.find("[data-testid='empty-state']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='games-won']").exists()).toBe(true);
    });

    it("should not offer clearing records", () => {
        recordGames([{ difficulty: "easy", elapsedSeconds: 120, completed: true }]);
        const { wrapper } = mountStatistics();

        expect(wrapper.find("[data-testid='clear-records-button']").exists()).toBe(false);
    });
});
