<template>
    <div
        class="flex flex-col gap-5 h-full px-5 pb-6 bg-background overflow-y-auto"
        data-skin="page page-ruled"
        data-testid="lesson-list"
    >
        <PageHeader
            :title="t('lessons.title')"
            @back="goBack"
        >
            <template #end>
                <span
                    class="text-foreground-secondary text-[13px] font-semibold tabular-nums whitespace-nowrap"
                    data-testid="lesson-finished-count"
                >{{ t("lessons.finishedCount", { done: lessonStore.finishedCount, total: ALL_LESSON_IDS.length }) }}</span>
            </template>
        </PageHeader>

        <section
            v-if="lessonStore.nextLesson !== null"
            class="flex flex-col gap-3 bg-card rounded-2xl shadow-card-lg p-4"
            data-skin="card"
            data-testid="lesson-next"
        >
            <div class="flex flex-col gap-0.5">
                <span class="text-primary text-[13px] font-semibold">{{ lessonStore.finishedCount === 0 ? t("lessons.firstCaption") : t("lessons.nextCaption") }}</span>
                <span class="text-foreground text-lg font-semibold">{{ t(`lessons.names.${lessonStore.nextLesson}`) }}</span>
                <span class="text-foreground-secondary text-[13px]">{{ t(`lessons.summaries.${lessonStore.nextLesson}`) }}</span>
            </div>
            <button
                v-press
                class="h-12 rounded-2xl bg-primary text-on-primary text-[15px] font-semibold shadow-primary cursor-pointer transition-all duration-200 hover:bg-primary-hover"
                data-skin="button"
                data-testid="lesson-next-start"
                type="button"
                @click="openLesson(lessonStore.nextLesson)"
            >
                {{ t("lessons.start") }}
            </button>
        </section>

        <section
            v-for="group in LESSON_GROUPS"
            :key="group.id"
            class="flex flex-col gap-2"
            :data-testid="`lesson-group-${group.id}`"
        >
            <div class="flex flex-col gap-0.5 px-1">
                <h2
                    class="flex justify-between gap-2 text-foreground-secondary text-[13px] font-semibold"
                    data-skin="group-heading"
                >
                    <span>{{ t(`lessons.groups.${group.id}.name`) }}</span>
                    <span class="tabular-nums">{{ t("lessons.finishedCount", { done: finishedIn(group), total: group.lessons.length }) }}</span>
                </h2>
                <p
                    class="text-foreground-muted text-xs"
                    data-skin="lesson-group-note"
                >
                    {{ t(`lessons.groups.${group.id}.note`) }}
                </p>
            </div>
            <div
                class="flex flex-col bg-card rounded-2xl shadow-card-sm px-3 py-1 divide-y divide-border"
                data-skin="card settings-card"
            >
                <button
                    v-for="lesson in group.lessons"
                    :key="lesson"
                    v-press:tint
                    class="flex items-center gap-3 min-h-14 py-2 w-full text-left cursor-pointer"
                    :data-testid="`lesson-row-${lesson}`"
                    data-skin="lesson-row"
                    type="button"
                    @click="openLesson(lesson)"
                >
                    <span
                        :class="MARK_CLASSES[markOf(lesson)]"
                        class="flex items-center justify-center size-6 shrink-0 rounded-full"
                        :data-skin="markOf(lesson) === 'done' ? 'lesson-mark done' : markOf(lesson) === 'next' ? 'lesson-mark next' : 'lesson-mark rest'"
                    >
                        <Check
                            v-if="markOf(lesson) === 'done'"
                            :size="14"
                            :stroke-width="3"
                        />
                    </span>
                    <span class="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span class="text-foreground text-[15px] font-medium">{{ t(`lessons.names.${lesson}`) }}</span>
                        <span class="text-foreground-muted text-[13px]">{{ t(`lessons.summaries.${lesson}`) }}</span>
                    </span>
                    <ChevronRight
                        :size="18"
                        class="shrink-0 text-foreground-muted"
                    />
                </button>
                <button
                    v-if="group.difficulty !== null && finishedIn(group) === group.lessons.length"
                    v-press:tint
                    class="flex items-center justify-center gap-1 min-h-11 w-full text-primary text-sm font-semibold cursor-pointer"
                    :data-testid="`lesson-group-play-${group.id}`"
                    data-skin="text-button"
                    type="button"
                    @click="newGameFlow.startNewGame(group.difficulty)"
                >
                    {{ t("lessons.playDifficulty", { difficulty: difficultyLabel(group.difficulty) }) }}
                    <ChevronRight :size="16" />
                </button>
            </div>
        </section>

        <LessonNoticeDialog />
        <NewGameDialog />
        <PuzzleLoader :visible="newGameFlow.puzzleLoader.visible.value" />
    </div>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ALL_LESSON_IDS, LESSON_GROUPS, type LessonGroup } from "@/domain/lessons/curriculum";
import type { LessonId } from "@/domain/lessons/Lesson";
import { Check, ChevronRight } from "@/presentation/components/icon";
import NewGameDialog from "@/presentation/components/new-game-dialog/NewGameDialog.vue";
import PageHeader from "@/presentation/components/page-header/PageHeader.vue";
import PuzzleLoader from "@/presentation/components/puzzle-loader/PuzzleLoader.vue";
import { goBackOr } from "@/presentation/composables/goBackOr";
import { useNewGameFlow } from "@/presentation/composables/useNewGameFlow";
import { vPress } from "@/presentation/directives/press";
import { useDifficultyLabel } from "@/presentation/i18n/difficultyLabels";
import LessonNoticeDialog from "@/presentation/pages/lessons/LessonNoticeDialog.vue";
import { useLessonNotice } from "@/presentation/pages/lessons/useLessonNotice";
import { ROUTER_PATH } from "@/router";
import { useLessonStore } from "@/stores/lessonStore";

type LessonMark = "done" | "next" | "rest";

const MARK_CLASSES: Record<LessonMark, string> = {
    done: "bg-primary text-on-primary",
    next: "ring-2 ring-inset ring-primary",
    rest: "ring-[1.5px] ring-inset ring-border",
};

const { t } = useI18n();
const router = useRouter();
const lessonStore = useLessonStore();
const newGameFlow = useNewGameFlow("lessons");
const difficultyLabel = useDifficultyLabel();
const notice = useLessonNotice();

onMounted(async () => {
    if (await notice.check() === "cancelled") goBack();
});

const markOf = (lesson: LessonId): LessonMark => {
    if (lessonStore.isFinished(lesson)) return "done";
    return lesson === lessonStore.nextLesson ? "next" : "rest";
};

const finishedIn = (group: LessonGroup): number => group.lessons.filter(lessonStore.isFinished).length;

const openLesson = (lesson: LessonId) => {
    void router.push(ROUTER_PATH.lessonFor(lesson));
};

const goBack = () => {
    goBackOr(router, ROUTER_PATH.home);
};
</script>
