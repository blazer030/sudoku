<template>
    <Transition name="modal">
        <div
            v-if="visible"
            ref="scrim"
            class="fixed inset-0 bg-scrim/60 flex items-center-safe justify-center overflow-y-auto py-safe-larger z-50"
            data-skin="dialog-scrim"
            :data-testid="testId"
        >
            <component
                :is="moments.celebration"
                v-if="moments.celebration !== null"
                :still="still"
            />
            <!-- Room above and below for a style's stamp, rod or seal past the card's edge, which the scrim
                 could not scroll back to. Only when what the card holds does not fit the window anyway: on a
                 phone it does, even one that cuts into the card's padding, and the card stays as it was. -->
            <div
                ref="card"
                :aria-labelledby="titleId"
                aria-modal="true"
                :class="{ 'my-16': contentTallerThanRoom }"
                class="bg-card rounded-3xl p-8 mx-6 w-full max-w-[354px] flex flex-col items-center gap-6 shadow-modal relative z-[52]"
                :data-still="still ? '' : undefined"
                data-skin="card celebration"
                :data-testid="cardTestId"
                role="dialog"
            >
                <component
                    :is="moments.cardDecoration"
                    v-if="moments.cardDecoration"
                    :still="still"
                />
                <div
                    class="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center"
                    data-skin="trophy"
                    :data-testid="iconTestId"
                >
                    <component
                        :is="icon"
                        class="text-primary"
                        :size="40"
                    />
                </div>

                <div class="flex flex-col items-center gap-2">
                    <h2
                        :id="titleId"
                        :class="titleClass"
                        class="text-[28px] font-bold text-foreground tracking-tight"
                        data-skin="complete-title"
                    >
                        {{ title }}
                    </h2>
                    <slot name="summary" />
                </div>

                <slot />
            </div>
        </div>
    </Transition>
</template>

<script lang="ts" setup>
import { useId, useTemplateRef, type Component } from "vue";
import { useStyleMoments } from "@/presentation/components/style-moments/styleMoments";
import { useContentTallerThanRoom } from "@/presentation/composables/useContentTallerThanRoom";

/**
 * The card that celebrates a solved game or a finished lesson: the style's celebration behind it, its
 * decoration on the card, the trophy or check and the title. The summary goes under the title, the
 * actions below. Still (motion not allowed) it shows its end state at once.
 */
defineProps<{
    visible: boolean;
    still: boolean;
    testId: string;
    cardTestId: string;
    icon: Component;
    iconTestId?: string;
    title: string;
    titleClass?: string;
}>();

defineSlots<{
    summary?: () => unknown;
    default?: () => unknown;
}>();

const moments = useStyleMoments();
const { contentTallerThanRoom } = useContentTallerThanRoom(useTemplateRef<HTMLElement>("scrim"), useTemplateRef<HTMLElement>("card"));
const titleId = useId();
</script>
