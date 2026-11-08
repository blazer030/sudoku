import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { defineComponent } from "vue";
import { createMemoryHistory, createRouter, type Router } from "vue-router";
import { ANALYTICS_KEY } from "@/application/analytics/AnalyticsService";
import type { LessonId } from "@/domain/lessons/Lesson";
import { NoopAnalyticsAdapter } from "@/infrastructure/analytics/NoopAnalyticsAdapter";
import { handleBackButton } from "@/presentation/composables/backDismissal";
import { i18n } from "@/presentation/i18n";
import LessonPage from "@/presentation/pages/lessons/LessonPage.vue";
import LessonScreen from "@/presentation/pages/lessons/LessonScreen.vue";
import { useGameStore } from "@/stores/gameStore";
import { useSettingsStore } from "@/stores/settingsStore";

vi.mock("@/presentation/components/puzzle-loader/usePuzzleLoader", async () => {
    const { ref } = await import("vue");
    return {
        usePuzzleLoader: () => ({
            visible: ref(false),
            runWithLoader: <T,>(task: () => Promise<T>) => task(),
        }),
    };
});

const Blank = defineComponent({ template: "<div />" });

/** `entries` are visited in order, the last being the lesson the page opens on. */
const mountPage = async (entries: readonly string[]) => {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/", component: Blank },
            { path: "/lessons", component: Blank },
            { path: "/lessons/:lessonId", component: Blank },
            { path: "/game", component: Blank },
            { path: "/settings/appearance", component: Blank },
        ],
    });
    for (const entry of entries) await router.push(entry);
    await router.isReady();
    const lessonId = router.currentRoute.value.params.lessonId as LessonId;
    const wrapper = mount(LessonPage, {
        props: { lessonId },
        global: { plugins: [router], provide: { [ANALYTICS_KEY as symbol]: new NoopAnalyticsAdapter() } },
    });
    await flushPromises();
    return { wrapper, router };
};

const UNFINISHED_GAME = {
    difficulty: "easy" as const,
    answer: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0)),
    cells: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ({ clue: 0, entry: 0, notes: [] }))),
    elapsedSeconds: 204,
    completed: false,
    hintsUsed: 0,
};

// A memory history keeps no state of its own; a browser's says there is nothing before a page opened by its address
const markOpenedByAddress = (router: Router) => {
    router.options.history.state.back = null;
};

// Going back in a memory history takes effect on a later task
const settled = () => new Promise(resolve => setTimeout(resolve, 0)).then(flushPromises);

describe("LessonPage", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        i18n.global.locale.value = "en";
    });

    afterEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    describe("going back", () => {
        it("should return to where the lesson was opened from", async () => {
            const { wrapper, router } = await mountPage(["/lessons", "/lessons/rules"]);

            wrapper.getComponent(LessonScreen).vm.$emit("back");
            await settled();

            expect(router.currentRoute.value.path).toBe("/lessons");
        });

        it("should go to the list from a lesson opened by its address", async () => {
            const { wrapper, router } = await mountPage(["/lessons/rules"]);
            markOpenedByAddress(router);

            wrapper.getComponent(LessonScreen).vm.$emit("back");
            await settled();

            expect(router.currentRoute.value.path).toBe("/lessons");
        });
    });

    it("should replace this entry with the next lesson, so Back from it goes to the list", async () => {
        const { wrapper, router } = await mountPage(["/lessons", "/lessons/rules"]);

        wrapper.getComponent(LessonScreen).vm.$emit("openLesson", "fillingIn");
        await settled();
        expect(router.currentRoute.value.path).toBe("/lessons/fillingIn");

        router.back();
        await settled();
        expect(router.currentRoute.value.path).toBe("/lessons");
    });

    it("should start a game of the difficulty the lesson hands on", async () => {
        const { wrapper, router } = await mountPage(["/lessons", "/lessons/nakedSingle"]);
        const startNewGame = vi.spyOn(useGameStore(), "startNewGame").mockResolvedValue();

        wrapper.getComponent(LessonScreen).vm.$emit("playDifficulty", "easy");
        await settled();

        expect(startNewGame).toHaveBeenCalledWith("easy");
        expect(router.currentRoute.value.path).toBe("/game");
    });

    describe("with a game unfinished", () => {
        const handOnToAGame = async () => {
            const page = await mountPage(["/lessons", "/lessons/nakedSingle"]);
            useGameStore().persistGame(UNFINISHED_GAME);
            const startNewGame = vi.spyOn(useGameStore(), "startNewGame").mockResolvedValue();
            page.wrapper.getComponent(LessonScreen).vm.$emit("playDifficulty", "easy");
            await settled();
            return { ...page, startNewGame };
        };

        it("should ask first, with staying worded for the lessons", async () => {
            const { wrapper } = await handOnToAGame();

            const stay = wrapper.get("[data-testid='new-game-stay-button']");
            expect(stay.text()).toBe(i18n.global.t("home.giveUp.stayInLessons"));
            expect(stay.text()).not.toBe(i18n.global.t("home.giveUp.stay"));
        });

        it("should stay on the lesson, starting nothing, when the player stays", async () => {
            const { wrapper, router, startNewGame } = await handOnToAGame();

            await wrapper.get("[data-testid='new-game-stay-button']").trigger("click");
            await settled();

            expect(router.currentRoute.value.path).toBe("/lessons/nakedSingle");
            expect(startNewGame).not.toHaveBeenCalled();
            expect(useGameStore().savedGame).toEqual(UNFINISHED_GAME);
        });
    });

    describe("opened by its address in 8-bit's light mode", () => {
        const useHandheld = () => {
            const settings = useSettingsStore();
            settings.setStyle("pixel");
            settings.setAppearance("light");
        };

        it("should ask first", async () => {
            useHandheld();
            const { wrapper } = await mountPage(["/lessons/rules"]);

            expect(wrapper.find("[data-testid='lesson-notice']").exists()).toBe(true);
        });

        it("should leave the lessons for Home when the notice is backed out of, as the list would only ask again", async () => {
            useHandheld();
            const { wrapper, router } = await mountPage(["/lessons/rules"]);
            markOpenedByAddress(router);

            handleBackButton(true);
            await settled();

            expect(wrapper.find("[data-testid='lesson-notice']").exists()).toBe(false);
            expect(router.currentRoute.value.path).toBe("/");
        });

        it("should stay on the lesson when the player carries on", async () => {
            useHandheld();
            const { wrapper, router } = await mountPage(["/lessons/rules"]);

            await wrapper.get("[data-testid='lesson-notice-carry-on']").trigger("click");
            await settled();

            expect(wrapper.find("[data-testid='lesson-notice']").exists()).toBe(false);
            expect(router.currentRoute.value.path).toBe("/lessons/rules");
        });
    });
});
