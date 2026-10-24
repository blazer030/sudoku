<template>
    <div
        ref="header"
        :data-scrolled="scrolled ? '' : undefined"
        class="flex items-center justify-between sticky top-0 bg-background pt-6 pb-3 z-10"
        data-skin="page-header"
    >
        <button
            class="flex items-center gap-2 cursor-pointer"
            :data-testid="backTestId"
            @click="emit('back')"
        >
            <ChevronLeft
                :size="24"
                class="text-foreground"
            />
            <span class="text-foreground text-base font-medium">{{ t("common.back") }}</span>
        </button>
        <span class="text-foreground text-lg font-semibold">{{ title }}</span>
        <!-- Balances the Back button so the title stays centred -->
        <div class="w-15" />
    </div>
</template>

<script lang="ts" setup>
import { useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { ChevronLeft } from "lucide-vue-next";
import { useScrolledHeader } from "@/presentation/composables/useScrolledHeader";

withDefaults(defineProps<{ title: string; backTestId?: string }>(), { backTestId: "back-button" });
const emit = defineEmits<{ back: [] }>();

const { t } = useI18n();
const header = useTemplateRef<HTMLElement>("header");
const scrolled = useScrolledHeader(header);
</script>
