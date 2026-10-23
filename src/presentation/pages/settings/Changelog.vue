<template>
    <div
        class="flex flex-col gap-5 h-full px-5 bg-background overflow-y-auto"
        data-skin="page"
    >
        <div
            class="flex items-center justify-between sticky top-0 bg-background pt-6 pb-3 z-10"
            data-skin="page-header"
        >
            <button
                class="flex items-center gap-2 cursor-pointer"
                data-testid="back-button"
                @click="goBack"
            >
                <ChevronLeft
                    :size="24"
                    class="text-foreground"
                />
                <span class="text-foreground text-base font-medium">{{ t("common.back") }}</span>
            </button>
            <span class="text-foreground text-lg font-semibold">{{ t("changelog.title") }}</span>
            <div class="w-15" />
        </div>

        <p
            class="text-xs text-foreground-secondary px-1"
            data-testid="changelog-app-note"
        >
            {{ t("changelog.appNote") }}
        </p>

        <div
            class="bg-card rounded-2xl px-4 shadow-card-sm divide-y divide-border"
            data-skin="card"
        >
            <div
                v-for="entry in entries"
                :key="entry.id"
                class="py-4"
                :data-testid="`changelog-entry-${entry.id}`"
            >
                <div class="flex items-baseline justify-between mb-2">
                    <span class="text-foreground text-[15px] font-semibold">{{ entry.title }}</span>
                    <span class="text-foreground-muted text-[13px]">{{ entry.date }}</span>
                </div>
                <ul class="flex flex-col gap-1.5">
                    <li
                        v-for="(change, index) in entry.changes"
                        :key="index"
                        class="text-foreground-muted text-[13px] leading-relaxed pl-3 relative before:absolute before:left-0 before:top-[0.5em] before:w-1 before:h-1 before:rounded-full before:bg-foreground-muted"
                    >
                        {{ change.text[appLocale] }}
                        <span
                            v-if="change.appOnly"
                            class="ml-0.5 inline-block align-[1px] rounded-full bg-primary-light text-primary text-[11px] font-semibold leading-4 px-1.5"
                            data-testid="changelog-app-badge"
                        >{{ t("changelog.appBadge") }}</span>
                    </li>
                </ul>
            </div>
        </div>

        <div class="flex-1" />
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppLocale } from "@/presentation/i18n/useAppLocale";
import { ChevronLeft } from "lucide-vue-next";
import { CHANGELOG, UNRELEASED_CHANGES, type ChangelogChange } from "@/presentation/pages/settings/changelogData";
import { isFeatureEnabled } from "@/utils/featureToggle";

const router = useRouter();
const { t } = useI18n();
const appLocale = useAppLocale();

interface ShownEntry {
    id: string;
    title: string;
    date: string;
    changes: ChangelogChange[];
}

// Develop builds also list what is waiting for the next release, on top and undated
const entries = computed((): ShownEntry[] => [
    ...(isFeatureEnabled("changelogUnreleased") && UNRELEASED_CHANGES.length > 0
        ? [{ id: "unreleased", title: t("changelog.unreleased"), date: "", changes: UNRELEASED_CHANGES }]
        : []),
    ...CHANGELOG.map(entry => ({ id: entry.version, title: `v${entry.version}`, date: entry.date, changes: entry.changes })),
]);

const goBack = () => {
    router.back();
};
</script>
