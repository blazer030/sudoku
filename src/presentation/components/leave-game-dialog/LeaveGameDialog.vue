<template>
    <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        data-testid="leave-game-dialog"
    >
        <div class="bg-card rounded-3xl p-8 mx-6 w-full max-w-[354px] flex flex-col items-center gap-6 shadow-modal">
            <div class="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center">
                <Save
                    :size="32"
                    class="text-primary"
                />
            </div>

            <div class="flex flex-col items-center gap-2">
                <h2 class="text-2xl font-bold text-foreground tracking-tight">
                    Leave Game?
                </h2>
                <p class="text-sm text-foreground-secondary text-center">
                    Do you want to save your current progress before leaving?
                </p>
            </div>

            <div class="flex flex-col gap-3 w-full">
                <button
                    class="w-full h-[52px] rounded-button bg-primary flex items-center justify-center gap-2 shadow-primary cursor-pointer"
                    data-testid="save-and-leave-button"
                    @click="emit('saveAndLeave')"
                >
                    <Save
                        :size="20"
                        class="text-white"
                    />
                    <span class="text-base font-semibold text-white">Save & Leave</span>
                </button>

                <button
                    class="w-full h-[52px] rounded-button bg-accent flex items-center justify-center gap-2 shadow-accent cursor-pointer"
                    data-testid="give-up-and-leave-button"
                    @click="emit('giveUpAndLeave')"
                >
                    <span class="text-base font-semibold text-white">Give Up & Leave</span>
                </button>

                <button
                    class="w-full h-[44px] flex items-center justify-center cursor-pointer"
                    data-testid="leave-cancel-button"
                    @click="emit('cancel')"
                >
                    <span class="text-base font-semibold text-foreground">Cancel</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { Save } from "lucide-vue-next";

const emit = defineEmits<{
    saveAndLeave: [];
    giveUpAndLeave: [];
    cancel: [];
}>();
</script>
