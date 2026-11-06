<template>
    <div class="h-full overflow-y-auto">
        <LessonScreen
            v-if="lesson !== null"
            :key="lesson.id"
            :lesson="lesson"
            @back="goBack"
            @open-lesson="openLesson"
            @play-difficulty="newGameFlow.startNewGame"
        />
        <NewGameDialog />
        <PuzzleLoader :visible="newGameFlow.puzzleLoader.visible.value" />
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { lessonContent } from "@/domain/lessons/content";
import type { LessonId } from "@/domain/lessons/Lesson";
import NewGameDialog from "@/presentation/components/new-game-dialog/NewGameDialog.vue";
import PuzzleLoader from "@/presentation/components/puzzle-loader/PuzzleLoader.vue";
import { goBackOr } from "@/presentation/composables/goBackOr";
import { useNewGameFlow } from "@/presentation/composables/useNewGameFlow";
import LessonScreen from "@/presentation/pages/lessons/LessonScreen.vue";
import { ROUTER_PATH } from "@/router";

const props = defineProps<{ lessonId: LessonId }>();

const router = useRouter();
const newGameFlow = useNewGameFlow();

const lesson = computed(() => lessonContent(props.lessonId));

const goBack = () => {
    goBackOr(router, ROUTER_PATH.lessons);
};

// In place of this entry, so Back from any lesson goes to the list
const openLesson = (next: LessonId) => {
    void router.replace(ROUTER_PATH.lessonFor(next));
};
</script>
