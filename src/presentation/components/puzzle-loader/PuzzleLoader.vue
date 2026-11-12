<template>
    <Transition name="modal">
        <div
            v-if="visible"
            class="fixed inset-0 bg-scrim/50 flex items-center justify-center z-50"
            data-skin="loader-scrim"
            data-testid="puzzle-loader"
        >
            <component
                :is="moments.loader"
                :message="message ?? t('home.generatingPuzzle')"
            />
        </div>
    </Transition>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useStyleMoments } from "@/presentation/components/style-moments/styleMoments";

const { t } = useI18n();
const moments = useStyleMoments();

withDefaults(defineProps<{
    visible: boolean;
    message?: string;
}>(), {
    message: undefined,
});
</script>
