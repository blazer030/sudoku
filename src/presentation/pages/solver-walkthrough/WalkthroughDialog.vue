<template>
    <Transition name="modal">
        <div
            v-if="visible && content"
            class="fixed inset-0 bg-scrim/50 flex items-center justify-center z-50"
            data-testid="walkthrough-dialog"
        >
            <div
                :aria-labelledby="titleId"
                aria-modal="true"
                class="bg-card rounded-3xl p-8 mx-6 w-full max-w-[354px] flex flex-col items-center gap-6 shadow-modal"
                role="dialog"
            >
                <div
                    :class="content.confirmTone === 'danger' ? 'bg-danger/10' : 'bg-primary-light'"
                    class="w-16 h-16 rounded-2xl flex items-center justify-center"
                >
                    <component
                        :is="content.icon"
                        :class="content.confirmTone === 'danger' ? 'text-danger' : 'text-primary'"
                        :size="32"
                    />
                </div>

                <div class="flex flex-col items-center gap-2">
                    <h2
                        :id="titleId"
                        class="text-2xl font-bold text-foreground tracking-tight text-center"
                        data-testid="walkthrough-dialog-title"
                    >
                        {{ t(content.titleKey) }}
                    </h2>
                    <p
                        class="text-sm text-foreground-secondary text-center"
                        data-testid="walkthrough-dialog-message"
                    >
                        {{ t(content.messageKey) }}
                    </p>
                </div>

                <div class="flex flex-col gap-3 w-full">
                    <button
                        v-press
                        :class="content.confirmTone === 'danger'
                            ? 'bg-danger text-on-danger shadow-danger hover:bg-danger-hover'
                            : 'bg-primary text-on-primary shadow-primary hover:bg-primary-hover'"
                        class="w-full h-[52px] rounded-button flex items-center justify-center text-base font-semibold cursor-pointer transition-all duration-200"
                        data-testid="walkthrough-dialog-confirm"
                        @click="close('confirm')"
                    >
                        {{ t(content.confirmKey) }}
                    </button>

                    <button
                        v-if="content.cancelKey !== null"
                        v-press
                        class="w-full h-11 flex items-center justify-center cursor-pointer rounded-button text-base font-semibold text-foreground transition-all duration-200 hover:bg-foreground/5"
                        data-testid="walkthrough-dialog-cancel"
                        @click="close('cancel')"
                    >
                        {{ t(content.cancelKey) }}
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script lang="ts" setup>
import { computed, type Component, useId } from "vue";
import { useI18n } from "vue-i18n";
import { RotateCcw } from "lucide-vue-next";
import { type WalkthroughDialogKind, useWalkthroughDialog } from "@/presentation/pages/solver-walkthrough/useWalkthroughDialog";
import { vPress } from "@/presentation/directives/press";

interface DialogContent {
    icon: Component;
    titleKey: string;
    messageKey: string;
    confirmKey: string;
    confirmTone: "danger" | "primary";
    cancelKey: string | null;
}

const CONTENT: Record<WalkthroughDialogKind, DialogContent> = {
    reset: {
        icon: RotateCcw,
        titleKey: "walkthrough.dialog.reset.title",
        messageKey: "walkthrough.dialog.reset.message",
        confirmKey: "walkthrough.dialog.reset.confirm",
        confirmTone: "danger",
        cancelKey: "common.cancel",
    },
};

const { t } = useI18n();
const { visible, params, close } = useWalkthroughDialog();
const titleId = useId();

const content = computed(() => (params.value === undefined ? null : CONTENT[params.value]));
</script>
