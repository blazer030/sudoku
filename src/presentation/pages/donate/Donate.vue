<template>
    <div class="flex flex-col gap-5 h-dvh px-5 bg-background">
        <h1 class="text-foreground text-xl font-semibold pt-6">
            Support
        </h1>
        <p class="text-foreground-muted">
            Donate page placeholder.
        </p>
    </div>
</template>

<script lang="ts" setup>
import { inject, onMounted } from "vue";
import { ANALYTICS_KEY } from "@/application/analytics/AnalyticsService";

const analytics = inject(ANALYTICS_KEY);

onMounted(() => {
    void analytics?.logEvent({ name: "donate_view" });
});
</script>
