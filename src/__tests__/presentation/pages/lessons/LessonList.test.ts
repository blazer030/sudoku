import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent } from "vue";
import { ANALYTICS_KEY } from "@/application/analytics/AnalyticsService";
import type { LessonId } from "@/domain/lessons/Lesson";
import { NoopAnalyticsAdapter } from "@/infrastructure/analytics/NoopAnalyticsAdapter";
import { i18n } from "@/presentation/i18n";
import LessonList from "@/presentation/pages/lessons/LessonList.vue";
import { useLessonStore } from "@/stores/lessonStore";

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

    it("should switch language with the app", async () => {
        const { wrapper } = await mountList();
        const before = wrapper.get("[data-testid='lesson-row-rules']").text();

        i18n.global.locale.value = "zh-Hant";
        await flushPromises();

        expect(wrapper.get("[data-testid='lesson-row-rules']").text()).not.toBe(before);
    });
});
