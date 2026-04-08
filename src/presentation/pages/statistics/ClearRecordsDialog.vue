<template>
    <Transition name="modal">
        <div
            v-if="visible"
            class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            data-testid="clear-records-dialog"
        >
            <div class="bg-card rounded-3xl p-8 mx-6 w-full max-w-[354px] flex flex-col items-center gap-6 shadow-modal">
                <div class="w-16 h-16 rounded-2xl bg-[#FFF3E0] flex items-center justify-center">
                    <Trash2
                        :size="32"
                        class="text-accent"
                    />
                </div>

                <div class="flex flex-col items-center gap-2">
                    <h2 class="text-2xl font-bold text-foreground tracking-tight">
                        Clear All Records?
                    </h2>
                    <p class="text-sm text-foreground-secondary text-center">
                        All your game history, statistics and best times will be permanently deleted. This action cannot be undone.
                    </p>
                </div>

                <div class="flex flex-col gap-3 w-full">
                    <button
                        class="w-full h-[52px] rounded-button bg-accent flex items-center justify-center gap-2 shadow-accent cursor-pointer transition-all duration-200 hover:bg-accent-hover hover:shadow-primary-lg"
                        data-testid="clear-records-confirm-button"
                        @click="close('confirm')"
                    >
                        <span class="text-base font-semibold text-white">Clear All Records</span>
                    </button>

                    <button
                        class="w-full h-[44px] flex items-center justify-center cursor-pointer rounded-button transition-all duration-200 hover:bg-foreground/5"
                        data-testid="clear-records-cancel-button"
                        @click="close('cancel')"
                    >
                        <span class="text-base font-semibold text-foreground">Cancel</span>
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script lang="ts" setup>
import { Trash2 } from "lucide-vue-next";
import { useClearRecordsDialog } from "./useClearRecordsDialog";

const { visible, close } = useClearRecordsDialog();
</script>
