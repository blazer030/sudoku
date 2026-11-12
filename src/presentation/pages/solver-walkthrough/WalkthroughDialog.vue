<template>
    <DialogShell
        v-if="content !== null"
        :icon="content.icon"
        :title="t(content.titleKey)"
        title-class="text-center"
        title-test-id="walkthrough-dialog-title"
        :tone="content.confirmTone === 'danger' ? 'danger' : 'primary'"
        :visible="visible"
        test-id="walkthrough-dialog"
    >
        <template #message>
            <p
                class="text-sm text-foreground-secondary text-center"
                data-testid="walkthrough-dialog-message"
            >
                {{ t(content.messageKey) }}
            </p>
        </template>

        <div class="flex flex-col gap-3 w-full">
            <button
                v-press
                data-skin="button"
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
                data-skin="text-button"
                data-testid="walkthrough-dialog-cancel"
                @click="close('cancel')"
            >
                {{ t(content.cancelKey) }}
            </button>
        </div>
    </DialogShell>
</template>

<script lang="ts" setup>
import DialogShell from "@/presentation/components/dialog-shell/DialogShell.vue";
import { computed, type Component } from "vue";
import { useI18n } from "vue-i18n";
import { CircleAlert, CircleHelp, RotateCcw } from "@/presentation/components/icon";
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
    noSolution: {
        icon: CircleAlert,
        titleKey: "walkthrough.dialog.noSolution.title",
        messageKey: "walkthrough.dialog.noSolution.message",
        confirmKey: "common.ok",
        confirmTone: "primary",
        cancelKey: null,
    },
    multipleSolutions: {
        icon: CircleHelp,
        titleKey: "walkthrough.dialog.multipleSolutions.title",
        messageKey: "walkthrough.dialog.multipleSolutions.message",
        confirmKey: "walkthrough.dialog.solveAnyway",
        confirmTone: "primary",
        cancelKey: "walkthrough.dialog.keepEditing",
    },
    solutionCountUnknown: {
        icon: CircleHelp,
        titleKey: "walkthrough.dialog.solutionCountUnknown.title",
        messageKey: "walkthrough.dialog.solutionCountUnknown.message",
        confirmKey: "walkthrough.dialog.solveAnyway",
        confirmTone: "primary",
        cancelKey: "walkthrough.dialog.keepEditing",
    },
};

const { t } = useI18n();
const { visible, params, close } = useWalkthroughDialog();

const content = computed(() => (params.value === undefined ? null : CONTENT[params.value]));
</script>
