<template>
    <GameScreen
        v-if="gameStore.hasActiveGame"
        :key="gameStore.gameSerial"
        @play-again="playAgain"
    />

    <PuzzleLoader :visible="puzzleLoader.visible.value" />
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router";
import GameScreen from "@/presentation/pages/game/GameScreen.vue";
import PuzzleLoader from "@/presentation/components/puzzle-loader/PuzzleLoader.vue";
import { usePuzzleLoader } from "@/presentation/components/puzzle-loader/usePuzzleLoader";
import { ROUTER_PATH } from "@/router";
import { useGameStore } from "@/stores/gameStore";

const router = useRouter();
const gameStore = useGameStore();
const puzzleLoader = usePuzzleLoader();

if (!gameStore.hasActiveGame) {
    void router.replace(ROUTER_PATH.home);
}

// A new game at the same difficulty; the new serial remounts the screen with a fresh timer, hints and guard
const playAgain = async () => {
    await puzzleLoader.runWithLoader(() => gameStore.startNewGame(gameStore.difficulty ?? "easy"));
};
</script>
