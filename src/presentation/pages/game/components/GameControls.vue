<template>
    <div class="flex justify-center gap-6">
        <ControlButton
            :icon="Undo2"
            :label="t('game.controls.undo')"
            data-testid="undo-button"
            @click="emit('undo')"
        />
        <ControlButton
            :icon="Pencil"
            :label="t('game.controls.notes')"
            :pressed="noteActive"
            :visible-text="noteActive ? t('game.controls.notesOn') : undefined"
            data-testid="note-button"
            @click="emit('toggleNoteMode')"
        />
        <ControlButton
            :icon="Lightbulb"
            :label="t('game.controls.hint')"
            data-testid="hint-button"
            @click="emit('showHintMenu')"
        />
    </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
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

const { t } = useI18n();
</script>
