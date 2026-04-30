import { ref } from "vue";
import { defineStore } from "pinia";
import { loadSettings, saveSettings, type ColorThemeId } from "@/application/SettingsStorage";
import { updateMetaThemeColor, updateFavicon, updateManifestLink, updateAppleTouchIcon } from "@/application/PwaThemeUpdater";
import type { IconService } from "@/application/icon/IconService";

export const useSettingsStore = defineStore("settings", () => {
    const settings = loadSettings();
    const colorTheme = ref<ColorThemeId>(settings.colorTheme);
    const highlightSameDigit = ref(settings.highlightSameDigit);
    const completionFlash = ref(settings.completionFlash);
    const autoRemoveNotes = ref(settings.autoRemoveNotes);
    const showRemainingCount = ref(settings.showRemainingCount);
    const matchLauncherIconToTheme = ref(settings.matchLauncherIconToTheme);
    let iconService: IconService | null = null;

    const applyColorTheme = () => {
        const id = colorTheme.value;
        document.documentElement.dataset.colorTheme = id;
        updateMetaThemeColor(id);
        updateFavicon(id);
        updateManifestLink(id);
        updateAppleTouchIcon(id);
    };

    const persistAll = () => {
        saveSettings({
            colorTheme: colorTheme.value,
            highlightSameDigit: highlightSameDigit.value,
            completionFlash: completionFlash.value,
            autoRemoveNotes: autoRemoveNotes.value,
            showRemainingCount: showRemainingCount.value,
            matchLauncherIconToTheme: matchLauncherIconToTheme.value,
        });
    };

    const setColorTheme = (id: ColorThemeId) => {
        colorTheme.value = id;
        applyColorTheme();
        persistAll();
        if (matchLauncherIconToTheme.value && iconService !== null) {
            void iconService.setIcon(id);
        }
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

    const setMatchLauncherIconToTheme = (value: boolean) => {
        const wasOn = matchLauncherIconToTheme.value;
        matchLauncherIconToTheme.value = value;
        persistAll();
        if (!wasOn && value && iconService !== null) {
            void iconService.setIcon(colorTheme.value);
        }
    };

    const setIconService = (service: IconService) => {
        iconService = service;
    };

    applyColorTheme();

    return {
        colorTheme,
        highlightSameDigit,
        completionFlash,
        autoRemoveNotes,
        showRemainingCount,
        matchLauncherIconToTheme,
        setColorTheme,
        setHighlightSameDigit,
        setCompletionFlash,
        setAutoRemoveNotes,
        setShowRemainingCount,
        setMatchLauncherIconToTheme,
        setIconService,
    };
});
