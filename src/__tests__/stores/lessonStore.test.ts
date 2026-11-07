import { createPinia, setActivePinia } from "pinia";
import type { LessonProgressRepository } from "@/application/lessons/LessonProgressRepository";
import type { LessonId } from "@/domain/lessons/Lesson";
import { useLessonStore } from "@/stores/lessonStore";
import { useStatisticsStore } from "@/stores/statisticsStore";

const fakeRepository = (stored: LessonId[] = []): LessonProgressRepository & { saved: LessonId[][] } => {
    const saved: LessonId[][] = [];
    return { saved, load: () => stored, save: finished => saved.push([...finished]) };
};

describe("lessonStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("should start from what the repository holds", () => {
        const store = useLessonStore();

        store.setRepository(fakeRepository(["rules"]));

        expect(store.isFinished("rules")).toBe(true);
        expect(store.isFinished("fillingIn")).toBe(false);
        expect(store.finishedCount).toBe(1);
    });

    it("should keep the progress when the game records are cleared", async () => {
        const store = useLessonStore();
        const repository = fakeRepository(["rules"]);
        store.setRepository(repository);

        await useStatisticsStore().clearAll();

        expect(store.isFinished("rules")).toBe(true);
        expect(repository.saved).toEqual([]);
    });

    it("should save a finished lesson once", () => {
        const store = useLessonStore();
        const repository = fakeRepository();
        store.setRepository(repository);

        store.finish("rules");
        store.finish("rules");

        expect(repository.saved).toEqual([["rules"]]);
    });

    it("should offer the first unfinished lesson in teaching order, whatever order they were finished in", () => {
        const store = useLessonStore();
        store.setRepository(fakeRepository(["fillingIn", "xWing"]));

        expect(store.nextLesson).toBe("rules");
    });

    it("should offer nothing once every lesson is finished", () => {
        const store = useLessonStore();
        store.setRepository(fakeRepository([
            "rules", "fillingIn", "hiddenSingle", "nakedSingle", "pointing", "claiming", "nakedPair", "hiddenPair", "nakedSubset",
            "hiddenSubset", "xWing", "fish", "xyWing", "wWing", "xyzWing", "xChain", "xyChain",
        ]));

        expect(store.nextLesson).toBeNull();
    });
});
