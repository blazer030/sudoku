<template>
    <Transition name="modal">
        <div
            v-if="visible"
            class="fixed inset-0 bg-scrim/50 flex items-center justify-center z-50"
            data-testid="puzzle-loader"
        >
            <component
                :is="moments.loader"
                :message="message"
            />
        </div>
    </Transition>
</template>

<script lang="ts" setup>
import { useStyleMoments } from "@/presentation/components/style-moments/styleMoments";

const moments = useStyleMoments();

withDefaults(defineProps<{
    visible: boolean;
    message?: string;
}>(), {
    message: undefined,
});
</script>
