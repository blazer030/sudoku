<template>
    <div
        class="flex flex-col gap-(--game-page-gap) min-h-full pt-(--game-page-top) pb-(--game-page-bottom) px-5 bg-background"
        data-skin="page"
        data-testid="lesson-screen"
    >
        <div class="grid grid-cols-[1fr_auto_1fr] items-center">
            <button
                class="flex items-center gap-2 cursor-pointer justify-self-start"
                data-testid="back-button"
                type="button"
                @click="emit('back')"
            >
                <ChevronLeft
                    :size="24"
                    class="text-foreground"
                />
                <span class="text-foreground text-base font-medium">{{ t("common.back") }}</span>
            </button>
            <span
                class="text-foreground text-lg font-semibold text-center"
                data-testid="lesson-title"
            >{{ t(`lessons.names.${lesson.id}`) }}</span>
        </div>

        <!-- The board stays where it is however long the panel's message runs -->
        <BoardFrame
            :celebration="null"
            :effect="null"
            :target="frameTarget"
        >
            <div
                :class="{ 'relative z-20': session.padCell.value !== null }"
                class="bg-card rounded-2xl shadow-card-lg p-2 self-center w-[calc(100%+1.5rem)] max-w-board-fit"
                data-skin="board"
                data-testid="lesson-board"
            >
                <div
                    class="relative flex flex-col border-3 border-foreground/20 rounded-xl"
                    data-skin="board-grid"
                >
                    <div
                        v-for="(row, rowIndex) in session.puzzleCells.value"
                        :key="`row-${rowIndex}`"
                        class="grid grid-cols-9"
                    >
                        <Cell
                            v-for="(puzzleCell, columnIndex) in row"
                            :key="`cell-${rowIndex}-${columnIndex}`"
                            :column="columnIndex"
                            :data-testid="`lesson-cell-${rowIndex}-${columnIndex}`"
                            :hint="session.cellViews.value[rowIndex][columnIndex]"
                            :interactive="isPractising"
                            :puzzle-cell="puzzleCell"
                            :row="rowIndex"
                            @click="session.tapCell(rowIndex, columnIndex)"
                        />
                    </div>
                    <StepLinkOverlay :links="links" />
                    <FloatingDigitPad
                        v-if="session.padCell.value !== null"
                        :cell="session.padCell.value"
                        :current-notes="[...session.practice.value.notes]"
                        :digit-counts="NO_DIGITS_USED_UP"
                        :erase-disabled="true"
                        :note-mode="session.practice.value.noteMode"
                        @select-digit="session.pressDigit"
                    />
                </div>
            </div>
        </BoardFrame>

        <div class="mt-auto pt-(--game-section-gap)">
            <LessonPanel
                :can-go-next="session.canGoNext.value"
                :message-key="messageKey"
                :message-kind="session.message.value.kind"
                :message-text="messageText"
                :note-mode="session.practice.value.noteMode"
                :primary-disabled="primaryDisabled"
                :primary-label="primaryLabel"
                :progress="progress"
                :secondary-disabled="secondaryDisabled"
                :secondary-label="secondaryLabel"
                :shows-note-toggle="session.step.value.kind === 'note' && !session.practice.value.solved"
                :stage="session.step.value.stage"
                :step-index="session.stepIndex.value"
                :total-steps="lesson.steps.length"
                @go-to="session.goTo"
                @next="session.next"
                @previous="session.previous"
                @primary="handlePrimary"
                @secondary="handleSecondary"
                @toggle-note-mode="session.toggleNoteMode"
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { BOARD_SIZE } from "@/domain/board/constants";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import { ALL_LESSON_IDS, groupOfLesson } from "@/domain/lessons/curriculum";
import type { Lesson, LessonId } from "@/domain/lessons/Lesson";
import type { PracticeFeedback } from "@/domain/lessons/practice";
import type { CellReference } from "@/domain/solver/SolveStep";
import BoardFrame from "@/presentation/components/board-frame/BoardFrame.vue";
import Cell from "@/presentation/components/board-cell/Cell.vue";
import FloatingDigitPad from "@/presentation/components/floating-digit-pad/FloatingDigitPad.vue";
import { ChevronLeft } from "@/presentation/components/icon";
import StepLinkOverlay from "@/presentation/components/step-presentation/StepLinkOverlay.vue";
import { useDifficultyLabel } from "@/presentation/i18n/difficultyLabels";
import LessonPanel from "@/presentation/pages/lessons/LessonPanel.vue";
import { useLessonSession } from "@/presentation/pages/lessons/useLessonSession";
import { useLessonStore } from "@/stores/lessonStore";

const props = withDefaults(defineProps<{
    lesson: Lesson;
    /** Opened over the Walkthrough: the way on is back to its step, not another lesson or a game. */
    fromWalkthrough?: boolean;
}>(), { fromWalkthrough: false });

const emit = defineEmits<{
    back: [];
    openLesson: [lesson: LessonId];
    playDifficulty: [difficulty: Difficulty];
}>();

// No key is greyed out for having all nine on the board: that would give the answer away
const NO_DIGITS_USED_UP = Array.from({ length: BOARD_SIZE + 1 }, () => 0);

const { t } = useI18n();
const difficultyLabel = useDifficultyLabel();
const lessonStore = useLessonStore();
const session = useLessonSession(props.lesson);

const isPractising = computed(() => session.step.value.kind !== "show" && session.step.value.kind !== "done");

const links = computed(() => [...(session.marks.value.links ?? [])]);

const frameTarget = computed((): CellReference | null =>
    session.padCell.value ?? session.marks.value.answers?.[0]?.cell ?? session.marks.value.lit?.[0] ?? null);

const feedbackText = (feedback: PracticeFeedback): string => {
    switch (feedback.kind) {
    case "conflict": {
        const key = { row: "conflictRow", column: "conflictColumn", box: "conflictBox" }[feedback.house];
        return t(`lessons.common.feedback.${key}`, { number: feedback.number, digit: feedback.digit });
    }
    case "notCertain":
    case "notTheAnswer":
        return t(`lessons.common.feedback.${feedback.kind}`, { digit: feedback.digit });
    case "message":
        return t(feedback.key);
    default:
        return t(`lessons.common.feedback.${feedback.kind}`);
    }
};

const messageText = computed(() => {
    const message = session.message.value;
    if (message.kind === "wrong") return feedbackText(message.feedback);
    if (message.kind === "hint") return t(message.hint.textKey, message.hint.params ?? {});
    return t(message.key);
});

// A new message swaps in; the same message on a new step does too
const messageKey = computed(() => `${session.stepIndex.value}-${messageText.value}`);

const progress = computed(() => {
    const step = session.step.value;
    if (step.kind !== "fill" || step.required <= 1) return null;
    return { done: session.practice.value.placed.length, total: step.required };
});

const nextIsPractice = computed(() => {
    const following = props.lesson.steps[session.stepIndex.value + 1] as Lesson["steps"][number] | undefined;
    return session.step.value.kind === "show" && following !== undefined && following.kind !== "show";
});

const isDone = computed(() => session.step.value.kind === "done");

watch(isDone, (done) => {
    if (done) lessonStore.finish(props.lesson.id);
});

const group = groupOfLesson(props.lesson.id);
const isLastOfGroup = group.lessons[group.lessons.length - 1] === props.lesson.id;
const followingLesson = ALL_LESSON_IDS[ALL_LESSON_IDS.indexOf(props.lesson.id) + 1] as LessonId | undefined;

const finishLabel = (): string => {
    if (props.fromWalkthrough) return t("lessons.common.actions.backToWalkthrough");
    if (isLastOfGroup && group.difficulty !== null) {
        return t("lessons.common.actions.playDifficulty", { difficulty: difficultyLabel(group.difficulty) });
    }
    return followingLesson === undefined
        ? t("lessons.common.actions.backToLessons")
        : t("lessons.common.actions.nextLesson", { name: t(`lessons.names.${followingLesson}`) });
};

const finishAction = () => {
    if (props.fromWalkthrough) emit("back");
    else if (isLastOfGroup && group.difficulty !== null) emit("playDifficulty", group.difficulty);
    else if (followingLesson !== undefined) emit("openLesson", followingLesson);
    else emit("back");
};

const primaryLabel = computed(() => {
    if (isDone.value) return finishLabel();
    return t(nextIsPractice.value ? "lessons.common.actions.tryIt" : "lessons.common.actions.next");
});
const primaryDisabled = computed(() => !isDone.value && !session.canGoNext.value);
const handlePrimary = () => {
    if (isDone.value) finishAction();
    else session.next();
};

const secondaryLabel = computed(() => {
    if (isDone.value) return t("lessons.common.actions.backToLessons");
    return t(session.step.value.kind === "show" ? "lessons.common.actions.skipToPractice" : "lessons.common.actions.hint");
});
const secondaryDisabled = computed(() => !isDone.value && session.step.value.kind !== "show" && !session.hintsLeft.value);
const handleSecondary = () => {
    if (isDone.value) emit("back");
    else if (session.step.value.kind === "show") session.skipToPractice();
    else session.requestHint();
};
</script>
