<template>
    <Transition name="modal">
        <div
            v-if="visible"
            ref="scrim"
            class="fixed inset-0 bg-scrim/60 flex items-center-safe justify-center overflow-y-auto py-safe-larger z-50"
            data-skin="dialog-scrim"
            data-testid="lesson-complete"
        >
            <component
                :is="moments.celebration"
                v-if="moments.celebration !== null"
                :still="still"
            />
            <div
                ref="card"
                :class="{ 'my-16': contentTallerThanRoom }"
                :data-still="still ? '' : undefined"
                class="bg-card rounded-3xl p-8 mx-6 w-full max-w-[354px] flex flex-col items-center gap-6 shadow-modal relative z-[52]"
                data-skin="card celebration"
                data-testid="lesson-complete-card"
            >
                <component
                    :is="moments.cardDecoration"
                    v-if="moments.cardDecoration"
                    :still="still"
                />
                <div
                    class="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center"
                    data-skin="trophy"
                >
                    <Check
                        :size="40"
                        class="text-primary"
                    />
                </div>

                <div class="flex flex-col items-center gap-2">
                    <h2
                        class="text-[28px] font-bold text-foreground tracking-tight text-center"
                        data-skin="complete-title"
                    >
                        {{ t("lessons.common.complete.title") }}
                    </h2>
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
                </div>

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
                    <button
                        v-press
                        class="h-11 px-3 flex items-center justify-center text-foreground-secondary font-medium cursor-pointer"
                        data-skin="text-button"
                        data-testid="lesson-complete-previous"
                        type="button"
                        @click="emit('previous')"
                    >
                        {{ t("lessons.common.complete.previousStep") }}
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script lang="ts" setup>
import { onScopeDispose, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ALL_LESSON_IDS } from "@/domain/lessons/curriculum";
import type { LessonId } from "@/domain/lessons/Lesson";
import { Check } from "@/presentation/components/icon";
import { useStyleMoments } from "@/presentation/components/style-moments/styleMoments";
import { registerBackDismissal } from "@/presentation/composables/backDismissal";
import { useContentTallerThanRoom } from "@/presentation/composables/useContentTallerThanRoom";
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
    previous: [];
}>();

const { t } = useI18n();
const lessonStore = useLessonStore();
const moments = useStyleMoments();
const still = !useMotionAllowed()();
const { contentTallerThanRoom } = useContentTallerThanRoom(useTemplateRef<HTMLElement>("scrim"), useTemplateRef<HTMLElement>("card"));

let withdrawBackDismissal: (() => void) | null = null;
const withdraw = () => {
    withdrawBackDismissal?.();
    withdrawBackDismissal = null;
};

watch(() => props.visible, (visible) => {
    withdraw();
    if (visible) withdrawBackDismissal = registerBackDismissal(() => { emit("previous"); });
});
// A next lesson takes the page with the dialog still open; Back must not be left closing it
onScopeDispose(withdraw);
</script>
