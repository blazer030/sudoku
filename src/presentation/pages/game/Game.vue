<template>
    <ClassicGame v-if="settingsStore.theme === 'classic'" />
    <ClassicGame v-else />
</template>

<script lang="ts" setup>
import { useSettingsStore } from "@/stores/settingsStore";
import ClassicGame from "./ClassicGame.vue";

const settingsStore = useSettingsStore();
</script>
