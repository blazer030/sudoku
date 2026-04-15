<template>
    <div class="flex justify-center gap-6">
        <ControlButton
            :icon="Undo2"
            data-testid="undo-button"
            @click="emit('undo')"
        />
        <ControlButton
            :active="noteActive"
            :icon="Pencil"
            data-testid="note-button"
            @click="emit('toggleNoteMode')"
        />
        <ControlButton
            :icon="Lightbulb"
            data-testid="hint-button"
            @click="emit('showHintMenu')"
        />
    </div>
</template>

<script lang="ts" setup>
import { Lightbulb, Pencil, Undo2 } from "lucide-vue-next";
import ControlButton from "@/presentation/pages/game/components/ControlButton.vue";

defineProps<{
    noteActive: boolean;
}>();

const emit = defineEmits<{
    undo: [];
    toggleNoteMode: [];
    showHintMenu: [];
}>();
</script>
