import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { LessonProgressRepository } from "@/application/lessons/LessonProgressRepository";
import { ALL_LESSON_IDS } from "@/domain/lessons/curriculum";
import type { LessonId } from "@/domain/lessons/Lesson";

export const useLessonStore = defineStore("lessons", () => {
    let repository: LessonProgressRepository | null = null;
    const finished = ref<LessonId[]>([]);

    const setRepository = (next: LessonProgressRepository) => {
        repository = next;
        finished.value = next.load();
    };

    const isFinished = (id: LessonId): boolean => finished.value.includes(id);

    const finish = (id: LessonId) => {
        if (isFinished(id)) return;
        finished.value = [...finished.value, id];
        repository?.save(finished.value);
    };

    const finishedCount = computed(() => finished.value.length);

    /** The first lesson not finished yet, in teaching order; none once all are. */
    const nextLesson = computed((): LessonId | null => ALL_LESSON_IDS.find(id => !isFinished(id)) ?? null);

    return { finished, finishedCount, nextLesson, isFinished, finish, setRepository };
});
