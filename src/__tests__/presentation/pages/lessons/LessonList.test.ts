import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent } from "vue";
import { ANALYTICS_KEY } from "@/application/analytics/AnalyticsService";
import { ALL_LESSON_IDS } from "@/domain/lessons/curriculum";
import type { LessonId } from "@/domain/lessons/Lesson";
import { NoopAnalyticsAdapter } from "@/infrastructure/analytics/NoopAnalyticsAdapter";
import { i18n } from "@/presentation/i18n";
import { handleBackButton } from "@/presentation/composables/backDismissal";
import LessonList from "@/presentation/pages/lessons/LessonList.vue";
import { ROUTER_PATH } from "@/router";
import { useGameStore } from "@/stores/gameStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useLessonStore } from "@/stores/lessonStore";

vi.mock("@/presentation/components/puzzle-loader/usePuzzleLoader", async () => {
    const { ref } = await import("vue");
    return {
        usePuzzleLoader: () => ({
            visible: ref(false),
            runWithLoader: <T,>(task: () => Promise<T>) => task(),
        }),
    };
});

const FIRST_SIX: LessonId[] = ["rules", "fillingIn", "hiddenSingle", "nakedSingle", "pointing", "claiming"];
const Blank = defineComponent({ template: "<div />" });

const mountList = async (finished: LessonId[] = []) => {
    const store = useLessonStore();
    store.setRepository({ load: () => finished, save: () => undefined });
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/", component: Blank },
            { path: "/lessons", component: LessonList },
            { path: "/lessons/:lessonId", component: Blank },
            { path: "/game", component: Blank },
            { path: "/settings/appearance", component: Blank },
        ],
    });
    await router.push("/lessons");
    await router.isReady();
    const wrapper = mount(LessonList, { global: { plugins: [router], provide: { [ANALYTICS_KEY as symbol]: new NoopAnalyticsAdapter() } } });
    return { wrapper, router };
};

describe("LessonList", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        i18n.global.locale.value = "en";
    });

    it("should list the 17 lessons under their four groups", async () => {
        const { wrapper } = await mountList();

        expect(wrapper.findAll("[data-testid^='lesson-group-']").map(group => group.attributes("data-testid"))).toEqual([
            "lesson-group-basics", "lesson-group-easy", "lesson-group-medium", "lesson-group-hard",
        ]);
        expect(wrapper.findAll("[data-testid^='lesson-row-']")).toHaveLength(17);
        expect(wrapper.get("[data-testid='lesson-group-easy']").findAll("[data-testid^='lesson-row-']").map(row => row.attributes("data-testid")))
            .toEqual(["lesson-row-hiddenSingle", "lesson-row-nakedSingle"]);
    });

    it("should open any lesson, with none locked", async () => {
        const { wrapper, router } = await mountList();

        await wrapper.get("[data-testid='lesson-row-xyChain']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe("/lessons/xyChain");
    });

    it("should offer the next lesson and show how many are finished", async () => {
        const { wrapper, router } = await mountList(FIRST_SIX);

        expect(wrapper.get("[data-testid='lesson-finished-count']").text()).toContain("6");
        expect(wrapper.get("[data-testid='lesson-finished-count']").text()).toContain("17");

        await wrapper.get("[data-testid='lesson-next-start']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe("/lessons/nakedPair");
    });

    it("should say the first lesson is where to begin when none is finished", async () => {
        const { wrapper } = await mountList();
        const fresh = wrapper.get("[data-testid='lesson-next']").text();
        const { wrapper: later } = await mountList(["rules"]);

        expect(fresh).not.toBe(later.get("[data-testid='lesson-next']").text());
    });

    it("should have no next-lesson card once every lesson is finished", async () => {
        const { wrapper } = await mountList([
            "rules", "fillingIn", "hiddenSingle", "nakedSingle", "pointing", "claiming", "nakedPair", "hiddenPair", "nakedSubset",
            "hiddenSubset", "xWing", "fish", "xyWing", "wWing", "xyzWing", "xChain", "xyChain",
        ]);

        expect(wrapper.find("[data-testid='lesson-next']").exists()).toBe(false);
    });

    it.each([
        ["rules", "done"],
        ["nakedPair", "next"],
        ["hiddenPair", "rest"],
    ])("should mark %s as %s through its skin token", async (lesson, state) => {
        const { wrapper } = await mountList(FIRST_SIX);
        const mark = wrapper.get(`[data-testid='lesson-row-${lesson}'] [data-skin~='lesson-mark']`);

        expect(mark.attributes("data-skin")?.split(" ")).toContain(state);
    });

    it("should offer a game only for a finished group with a difficulty", async () => {
        const { wrapper } = await mountList(["rules", "fillingIn", "hiddenSingle", "nakedSingle"]);

        expect(wrapper.find("[data-testid='lesson-group-play-easy']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='lesson-group-play-basics']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='lesson-group-play-medium']").exists()).toBe(false);
    });

    it.each([
        ["easy", "easy"],
        ["medium", "medium"],
        ["hard", "hard"],
    ] as const)("should start a %s game from that group's button, once every lesson of it is finished", async (group, difficulty) => {
        const { wrapper, router } = await mountList([...ALL_LESSON_IDS]);
        const startNewGame = vi.spyOn(useGameStore(), "startNewGame").mockResolvedValue();

        await wrapper.get(`[data-testid='lesson-group-play-${group}']`).trigger("click");
        await flushPromises();

        expect(startNewGame).toHaveBeenCalledWith(difficulty);
        expect(router.currentRoute.value.path).toBe("/game");
    });

    it("should stay on the list, starting nothing, when the player keeps an unfinished game", async () => {
        const { wrapper, router } = await mountList([...ALL_LESSON_IDS]);
        const game = useGameStore();
        game.persistGame({
            difficulty: "easy",
            answer: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0)),
            cells: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ({ clue: 0, entry: 0, notes: [] }))),
            elapsedSeconds: 204,
            completed: false,
            hintsUsed: 0,
        });
        const startNewGame = vi.spyOn(game, "startNewGame").mockResolvedValue();

        await wrapper.get("[data-testid='lesson-group-play-easy']").trigger("click");
        await flushPromises();
        const stay = wrapper.get("[data-testid='new-game-stay-button']");
        expect(stay.text()).toBe(i18n.global.t("home.giveUp.stayInLessons"));
        await stay.trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe("/lessons");
        expect(startNewGame).not.toHaveBeenCalled();
    });

    describe("in 8-bit's light mode", () => {
        const useHandheld = () => {
            const settings = useSettingsStore();
            settings.setStyle("pixel");
            settings.setAppearance("light");
            return settings;
        };
        const notice = (wrapper: VueWrapper) => wrapper.find("[data-testid='lesson-notice']");

        afterEach(() => {
            localStorage.clear();
        });

        it("should show the notice on entering", async () => {
            useHandheld();
            const { wrapper } = await mountList();
            await flushPromises();

            expect(notice(wrapper).exists()).toBe(true);
        });

        it("should switch to the dark mode and go on", async () => {
            const settings = useHandheld();
            const { wrapper } = await mountList();
            await flushPromises();

            await wrapper.get("[data-testid='lesson-notice-switch']").trigger("click");
            await flushPromises();

            expect(settings.appearance).toBe("dark");
            expect(settings.style).toBe("pixel");
            expect(notice(wrapper).exists()).toBe(false);
        });

        it("should open Appearance to look at other styles", async () => {
            useHandheld();
            const { wrapper, router } = await mountList();
            await flushPromises();

            await wrapper.get("[data-testid='lesson-notice-styles']").trigger("click");
            await flushPromises();

            expect(router.currentRoute.value.path).toBe(ROUTER_PATH.appearance);
        });

        it("should remember carrying on", async () => {
            const settings = useHandheld();
            const { wrapper } = await mountList();
            await flushPromises();

            await wrapper.get("[data-testid='lesson-notice-carry-on']").trigger("click");
            await flushPromises();

            expect(notice(wrapper).exists()).toBe(false);
            expect(settings.handheldLessonNoticeDismissed).toBe(true);

            const { wrapper: later } = await mountList();
            await flushPromises();

            expect(notice(later).exists()).toBe(false);
        });

        it("should ask again after a switch back, when the player never chose to carry on", async () => {
            const settings = useHandheld();
            const { wrapper } = await mountList();
            await flushPromises();
            await wrapper.get("[data-testid='lesson-notice-switch']").trigger("click");
            await flushPromises();

            settings.setAppearance("light");
            const { wrapper: later } = await mountList();
            await flushPromises();

            expect(notice(later).exists()).toBe(true);
        });

        it("should leave with the system Back key", async () => {
            useHandheld();
            const { wrapper, router } = await mountList();
            await router.replace("/");
            await router.push("/lessons");
            await flushPromises();
            const back = vi.spyOn(router, "back");

            handleBackButton(true);
            await flushPromises();

            expect(notice(wrapper).exists()).toBe(false);
            expect(back).toHaveBeenCalled();
        });
    });

    it.each(["minimal", "pixel"] as const)("should show no notice in %s with its other looks", async (style) => {
        const settings = useSettingsStore();
        settings.setStyle(style);
        settings.setAppearance("dark");
        const { wrapper } = await mountList();
        await flushPromises();

        expect(wrapper.find("[data-testid='lesson-notice']").exists()).toBe(false);
        localStorage.clear();
    });

    it("should switch language with the app", async () => {
        const { wrapper } = await mountList();
        const before = wrapper.get("[data-testid='lesson-row-rules']").text();

        i18n.global.locale.value = "zh-Hant";
        await flushPromises();

        expect(wrapper.get("[data-testid='lesson-row-rules']").text()).not.toBe(before);
    });
});
