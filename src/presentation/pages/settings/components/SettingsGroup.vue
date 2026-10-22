<template>
    <section
        :data-testid="`settings-group-${id}`"
        class="flex flex-col gap-2"
    >
        <h2 class="flex items-center gap-1.5 px-1 text-foreground-secondary text-[13px] font-semibold">
            <component
                :is="icon"
                :size="16"
                class="text-primary"
            />
            {{ title }}
        </h2>
        <div class="bg-card rounded-2xl shadow-card-sm p-3">
            <slot />
        </div>
    </section>
</template>

<script lang="ts" setup>
import type { Component } from "vue";

defineProps<{
    id: string;
    title: string;
    icon: Component;
}>();
</script>
