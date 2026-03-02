<template>
  <div class="flex flex-col h-full justify-center items-center gap-4 px-12">
    <div class="mb-32 rounded-full bg-sky-200 p-4 text-white text-8xl">
      🧩
    </div>

    <Button
      variant="outline"
      class="rounded-full w-full text-gray-500"
      @click="router.push(ROUTER_PATH.game)"
    >
      New Game
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import Button from "@/presentation/components/ui/button/Button.vue";
import { ROUTER_PATH } from "@/router";

const router = useRouter();
</script>
