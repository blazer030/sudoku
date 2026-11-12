<template>
    <CelebrationCard
        card-test-id="lesson-complete-card"
        :icon="Check"
        :still="still"
        :title="t('lessons.common.complete.title')"
        title-class="text-center"
        :visible="visible"
        test-id="lesson-complete"
    >
        <template #summary>
            <span
                class="bg-accent/10 text-accent text-[13px] font-semibold rounded-full px-2.5 py-1"
                data-skin="tag"
            >{{ t(`lessons.names.${lessonId}`) }}</span>
            <p class="text-base text-foreground-secondary text-center">
                {{ takeaway }}
            </p>
            <p class="text-[13px] font-medium text-foreground-muted text-center">
                {{ t("lessons.common.complete.progress", { done: lessonStore.finishedCount, total: ALL_LESSON_IDS.length }) }}
            </p>
        </template>

        <div class="flex flex-col gap-2 w-full">
            <button
                v-press
                class="w-full min-h-[52px] px-4 py-2 rounded-button bg-primary text-on-primary text-base font-semibold flex items-center justify-center shadow-primary cursor-pointer"
                data-skin="button"
                data-testid="lesson-complete-next"
                type="button"
                @click="emit('next')"
            >
                {{ actionLabel }}
            </button>
            <button
                v-press
                class="h-11 px-3 flex items-center justify-center text-foreground-secondary font-medium cursor-pointer"
                data-skin="text-button"
                data-testid="lesson-complete-back"
                type="button"
                @click="emit('leave')"
            >
                {{ t("lessons.common.actions.backToLessons") }}
            </button>
        </div>
    </CelebrationCard>
</template>

<script lang="ts" setup>
import { onScopeDispose, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ALL_LESSON_IDS } from "@/domain/lessons/curriculum";
import type { LessonId } from "@/domain/lessons/Lesson";
import { Check } from "@/presentation/components/icon";
import CelebrationCard from "@/presentation/components/celebration-card/CelebrationCard.vue";
import { registerBackDismissal } from "@/presentation/composables/backDismissal";
import { useMotionAllowed } from "@/presentation/composables/useMotionAllowed";
import { vPress } from "@/presentation/directives/press";
import { useLessonStore } from "@/stores/lessonStore";

const props = defineProps<{
    visible: boolean;
    lessonId: LessonId;
    takeaway: string;
    actionLabel: string;
}>();

const emit = defineEmits<{
    next: [];
    leave: [];
}>();

const { t } = useI18n();
const lessonStore = useLessonStore();
const still = !useMotionAllowed()();

let withdrawBackDismissal: (() => void) | null = null;
const withdraw = () => {
    withdrawBackDismissal?.();
    withdrawBackDismissal = null;
};

watch(() => props.visible, (visible) => {
    withdraw();
    if (visible) withdrawBackDismissal = registerBackDismissal(() => { emit("leave"); });
});
// A next lesson takes the page with the dialog still open; Back must not be left closing it
onScopeDispose(withdraw);
</script>
