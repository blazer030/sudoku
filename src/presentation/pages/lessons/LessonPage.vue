<template>
    <div class="h-full overflow-y-auto">
        <Transition
            mode="out-in"
            name="lesson-swap"
        >
            <LessonScreen
                :key="lesson.id"
                :lesson="lesson"
                @back="goBack"
                @open-lesson="openLesson"
                @play-difficulty="newGameFlow.startNewGame"
            />
        </Transition>
        <LessonNoticeDialog />
        <NewGameDialog />
        <PuzzleLoader :visible="newGameFlow.puzzleLoader.visible.value" />
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { lessonContent } from "@/domain/lessons/content";
import type { LessonId } from "@/domain/lessons/Lesson";
import NewGameDialog from "@/presentation/components/new-game-dialog/NewGameDialog.vue";
import PuzzleLoader from "@/presentation/components/puzzle-loader/PuzzleLoader.vue";
import { goBackOr } from "@/presentation/composables/goBackOr";
import { useNewGameFlow } from "@/presentation/composables/useNewGameFlow";
import LessonNoticeDialog from "@/presentation/pages/lessons/LessonNoticeDialog.vue";
import LessonScreen from "@/presentation/pages/lessons/LessonScreen.vue";
import { useLessonNotice } from "@/presentation/pages/lessons/useLessonNotice";
import { ROUTER_PATH } from "@/router";

const props = defineProps<{ lessonId: LessonId }>();

const router = useRouter();
const newGameFlow = useNewGameFlow("lessons");

const notice = useLessonNotice();

const lesson = computed(() => lessonContent(props.lessonId));

const goBack = () => {
    goBackOr(router, ROUTER_PATH.lessons);
};

// Lessons usually open from the list, which has asked already; this is for one opened by its address
onMounted(async () => {
    if (await notice.check() === "cancelled") goBack();
});

// In place of this entry, so Back from any lesson goes to the list
const openLesson = (next: LessonId) => {
    void router.replace(ROUTER_PATH.lessonFor(next));
};
</script>
