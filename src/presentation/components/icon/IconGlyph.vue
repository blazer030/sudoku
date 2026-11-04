<!-- eslint-disable vue/no-v-html -- the markup is our own static drawings from src/style, never user input -->
<template>
    <component
        :is="lucide"
        v-if="iconSet === null"
        :data-icon="name"
        :size="size"
    />
    <svg
        v-else
        v-bind="iconSet.svgAttributes"
        aria-hidden="true"
        :data-icon="name"
        :data-icon-small="size <= SMALL_ICON_SIZE ? '' : undefined"
        :height="shownSize"
        :viewBox="iconSet.viewBox"
        :width="shownSize"
        v-html="markup"
    />
</template>

<script setup lang="ts">
import { computed, useId, type Component } from "vue";
import { activeIconSet } from "./activeIconSet";
import type { IconName } from "@/style/iconSet";

const props = withDefaults(defineProps<{
    name: IconName;
    lucide: Component;
    size?: number;
}>(), { size: 24 });

// At this size and below a style drops its finest detail (data-icon-small)
const SMALL_ICON_SIZE = 20;

const iconSet = activeIconSet;
const instanceId = `icon-${useId().replace(/\W/g, "")}`;

const shownSize = computed(() => iconSet.value?.snapSize?.(props.size) ?? props.size);
const markup = computed(() => {
    const set = iconSet.value;
    if (set === null) return "";
    return `${set.defs ?? ""}${set.drawings[props.name]}`.replace(/\{id\}/g, instanceId);
});
</script>
