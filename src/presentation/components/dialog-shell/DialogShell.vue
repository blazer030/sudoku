<template>
    <Transition name="modal">
        <div
            v-if="visible"
            class="fixed inset-0 bg-scrim/50 flex items-center-safe justify-center overflow-y-auto py-safe-larger z-50"
            data-skin="dialog-scrim"
            :data-testid="testId"
            @click.self="emit('scrimClick')"
        >
            <div
                :aria-labelledby="titleId"
                aria-modal="true"
                class="bg-card rounded-3xl p-8 mx-6 w-full max-w-[354px] flex flex-col items-center gap-6 shadow-modal"
                data-skin="card"
                role="dialog"
            >
                <div
                    :class="tone === 'danger' ? 'bg-danger/10' : 'bg-primary-light'"
                    :data-skin="tone === 'danger' ? 'icon-tile danger' : 'icon-tile'"
                    class="w-16 h-16 rounded-2xl flex items-center justify-center"
                >
                    <component
                        :is="icon"
                        :class="tone === 'danger' ? 'text-danger' : 'text-primary'"
                        :size="32"
                    />
                </div>

                <div class="flex flex-col items-center gap-2">
                    <h2
                        :id="titleId"
                        :class="titleClass"
                        class="text-2xl font-bold text-foreground tracking-tight"
                        data-skin="dialog-title"
                        :data-testid="titleTestId"
                    >
                        {{ title }}
                    </h2>
                    <slot name="message" />
                </div>

                <slot />
            </div>
        </div>
    </Transition>
</template>

<script lang="ts" setup>
import { useId, type Component } from "vue";

/**
 * The app's confirm dialogs (leave, new game, clear records, the Walkthrough's, the lesson notice): the
 * scrim, the card, its icon tile and title. The message goes under the title, the actions below.
 */
defineProps<{
    visible: boolean;
    testId: string;
    icon: Component;
    // A danger dialog's tile and icon are in the danger colour, any other's in the primary
    tone: "primary" | "danger";
    title: string;
    titleClass?: string;
    titleTestId?: string;
}>();

const emit = defineEmits<{
    scrimClick: [];
}>();

defineSlots<{
    message?: () => unknown;
    default?: () => unknown;
}>();

const titleId = useId();
</script>
