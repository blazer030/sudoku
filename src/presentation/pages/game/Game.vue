<template>
    <GameScreen v-if="gameStore.hasActiveGame" />
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router";
import GameScreen from "@/presentation/pages/game/GameScreen.vue";
import { ROUTER_PATH } from "@/router";
import { useGameStore } from "@/stores/gameStore";

const router = useRouter();
const gameStore = useGameStore();

if (!gameStore.hasActiveGame) {
    void router.replace(ROUTER_PATH.home);
}
</script>
