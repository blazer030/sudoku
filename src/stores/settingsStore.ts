import { ref } from "vue";
import { defineStore } from "pinia";
import { loadSettings, saveSettings, type ColorThemeId } from "@/application/SettingsStorage";

export const useSettingsStore = defineStore("settings", () => {
    const settings = loadSettings();
    const colorTheme = ref<ColorThemeId>(settings.colorTheme);
    const highlightSameDigit = ref(settings.highlightSameDigit);
    const completionFlash = ref(settings.completionFlash);
    const autoRemoveNotes = ref(settings.autoRemoveNotes);
    const showRemainingCount = ref(settings.showRemainingCount);

    const applyColorTheme = () => {
        document.documentElement.dataset.colorTheme = colorTheme.value;
    };

    const persistAll = () => {
        saveSettings({
            colorTheme: colorTheme.value,
            highlightSameDigit: highlightSameDigit.value,
            completionFlash: completionFlash.value,
            autoRemoveNotes: autoRemoveNotes.value,
            showRemainingCount: showRemainingCount.value,
        });
    };

    const setColorTheme = (id: ColorThemeId) => {
        colorTheme.value = id;
        applyColorTheme();
        persistAll();
    };

    const setHighlightSameDigit = (value: boolean) => {
        highlightSameDigit.value = value;
        persistAll();
    };

    const setCompletionFlash = (value: boolean) => {
        completionFlash.value = value;
        persistAll();
    };

    const setAutoRemoveNotes = (value: boolean) => {
        autoRemoveNotes.value = value;
        persistAll();
    };

    const setShowRemainingCount = (value: boolean) => {
        showRemainingCount.value = value;
        persistAll();
    };

    applyColorTheme();

    return {
        colorTheme,
        highlightSameDigit,
        completionFlash,
        autoRemoveNotes,
        showRemainingCount,
        setColorTheme,
        setHighlightSameDigit,
        setCompletionFlash,
        setAutoRemoveNotes,
        setShowRemainingCount,
    };
});
