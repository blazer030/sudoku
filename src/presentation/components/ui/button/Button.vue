<template>
  <button :class="cn(buttonVariants({ variant, size, selected }))">
    <slot />
  </button>
</template>

<script setup lang="ts">
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/presentation/components/ui/lib/utils";
import buttonVariants from "@/presentation/components/ui/button/variants";

defineProps<{
    variant?: VariantProps<typeof buttonVariants>["variant"];
    size?: VariantProps<typeof buttonVariants>["size"];
    selected?: VariantProps<typeof buttonVariants>["selected"];
}>();
</script>
