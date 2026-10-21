import { ref } from "vue";
import { defineStore } from "pinia";
import { loadSettings, saveSettings, type Appearance, type ColorThemeId, type LanguagePreference, type StyleId } from "@/application/SettingsStorage";
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
    const language = ref<LanguagePreference>(settings.language);
    const appearance = ref<Appearance>(settings.appearance);
    const style = ref<StyleId>(settings.style);
    let iconService: IconService | null = null;

    const applyColorTheme = () => {
        const id = colorTheme.value;
        document.documentElement.dataset.colorTheme = id;
        // The generated theme blocks are keyed by style as well as theme
        document.documentElement.dataset.style = style.value;
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
            language: language.value,
            appearance: appearance.value,
            style: style.value,
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

    const setLanguage = (value: LanguagePreference) => {
        language.value = value;
        persistAll();
    };

    const setAppearance = (value: Appearance) => {
        appearance.value = value;
        persistAll();
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
        language,
        appearance,
        style,
        setColorTheme,
        setHighlightSameDigit,
        setCompletionFlash,
        setAutoRemoveNotes,
        setShowRemainingCount,
        setMatchLauncherIconToTheme,
        setLanguage,
        setAppearance,
        setIconService,
    };
});
