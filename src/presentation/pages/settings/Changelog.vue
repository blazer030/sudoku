<template>
    <div class="flex flex-col gap-5 h-dvh px-5 bg-background overflow-y-auto">
        <div class="flex items-center justify-between sticky top-0 bg-background pt-6 pb-3 z-10">
            <button
                class="flex items-center gap-2 cursor-pointer"
                data-testid="back-button"
                @click="goBack"
            >
                <ChevronLeft
                    :size="24"
                    class="text-foreground"
                />
                <span class="text-foreground text-base font-medium">Back</span>
            </button>
            <span class="text-foreground text-lg font-semibold">Changelog</span>
            <div class="w-15" />
        </div>

        <div class="bg-card rounded-2xl px-4 shadow-card-sm divide-y divide-border">
            <div
                v-for="entry in CHANGELOG"
                :key="entry.version"
                class="py-4"
                :data-testid="`changelog-entry-${entry.version}`"
            >
                <div class="flex items-baseline justify-between mb-2">
                    <span class="text-foreground text-[15px] font-semibold">v{{ entry.version }}</span>
                    <span class="text-foreground-muted text-[13px]">{{ entry.date }}</span>
                </div>
                <ul class="flex flex-col gap-1.5">
                    <li
                        v-for="(change, index) in entry.changes"
                        :key="index"
                        class="text-foreground-muted text-[13px] leading-relaxed pl-3 relative before:absolute before:left-0 before:top-[0.5em] before:w-1 before:h-1 before:rounded-full before:bg-foreground-muted"
                    >
                        {{ change }}
                    </li>
                </ul>
            </div>
        </div>

        <div class="flex-1" />
    </div>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router";
import { ChevronLeft } from "lucide-vue-next";
import { CHANGELOG } from "@/presentation/pages/settings/changelogData";

const router = useRouter();

const goBack = () => {
    router.back();
};
</script>
