<template>
    <component
        :is="lucide"
        :data-icon="name"
        :size="size"
    />
</template>

<script setup lang="ts">
import type { Component } from "vue";
import type { IconName } from "@/style/iconSet";

withDefaults(defineProps<{
    name: IconName;
    lucide: Component;
    size?: number;
}>(), { size: 24 });
</script>
