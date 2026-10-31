import { ref } from "vue";
import { defineStore } from "pinia";
import type { ColorMode, ColorThemeId, RememberedAppearances, RememberedThemes, StyleId } from "@/theme/themeIds";
import { loadSettings, saveSettings, type LanguagePreference } from "@/application/settings/SettingsStorage";
import { rememberedAppearanceFor, rememberedThemeFor } from "@/theme/palettes";
import { pwaIconKey } from "@/theme/launcherIcon";
import { updateManifestLink, updateAppleTouchIcon } from "@/application/PwaThemeUpdater";

export const useSettingsStore = defineStore("settings", () => {
    const settings = loadSettings();
    const colorTheme = ref<ColorThemeId>(settings.colorTheme);
    const highlightSameDigit = ref(settings.highlightSameDigit);
    const motionEffects = ref(settings.motionEffects);
    const autoRemoveNotes = ref(settings.autoRemoveNotes);
    const showRemainingCount = ref(settings.showRemainingCount);
    const matchLauncherIconToTheme = ref(settings.matchLauncherIconToTheme);
    const language = ref<LanguagePreference>(settings.language);
    const appearance = ref<ColorMode>(settings.appearance);
    const style = ref<StyleId>(settings.style);
    const highlightScope = ref(settings.highlightScope);
    const colorThemeByStyle = ref<RememberedThemes>(settings.colorThemeByStyle);
    const appearanceByStyle = ref<RememberedAppearances>(settings.appearanceByStyle);

    // Installed web apps keep the light icon; the favicon also follows light or dark, so appearanceSync keeps it
    const applyColorTheme = () => {
        const icon = pwaIconKey(style.value, colorTheme.value);
        updateManifestLink(icon);
        updateAppleTouchIcon(icon);
    };

    const persistAll = () => {
        saveSettings({
            colorTheme: colorTheme.value,
            highlightSameDigit: highlightSameDigit.value,
            motionEffects: motionEffects.value,
            autoRemoveNotes: autoRemoveNotes.value,
            showRemainingCount: showRemainingCount.value,
            matchLauncherIconToTheme: matchLauncherIconToTheme.value,
            language: language.value,
            appearance: appearance.value,
            style: style.value,
            highlightScope: highlightScope.value,
            colorThemeByStyle: { ...colorThemeByStyle.value },
            appearanceByStyle: { ...appearanceByStyle.value },
        });
    };

    const setColorTheme = (id: ColorThemeId) => {
        colorTheme.value = id;
        colorThemeByStyle.value = { ...colorThemeByStyle.value, [style.value]: id };
        applyColorTheme();
        persistAll();
    };

    // Goes through setColorTheme so the manifest and storage follow (launcherIconSync watches the result)
    const setStyle = (id: StyleId) => {
        style.value = id;
        appearance.value = rememberedAppearanceFor(id, appearanceByStyle.value);
        setColorTheme(rememberedThemeFor(id, colorThemeByStyle.value));
    };

    const setHighlightSameDigit = (value: boolean) => {
        highlightSameDigit.value = value;
        persistAll();
    };

    const setMotionEffects = (value: boolean) => {
        motionEffects.value = value;
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
        matchLauncherIconToTheme.value = value;
        persistAll();
    };

    const setLanguage = (value: LanguagePreference) => {
        language.value = value;
        persistAll();
    };

    const setAppearance = (value: ColorMode) => {
        appearance.value = value;
        appearanceByStyle.value = { ...appearanceByStyle.value, [style.value]: value };
        persistAll();
    };

    const setHighlightScope = (value: boolean) => {
        highlightScope.value = value;
        persistAll();
    };

    applyColorTheme();

    return {
        colorTheme,
        highlightSameDigit,
        motionEffects,
        autoRemoveNotes,
        showRemainingCount,
        matchLauncherIconToTheme,
        language,
        appearance,
        style,
        highlightScope,
        colorThemeByStyle,
        appearanceByStyle,
        setColorTheme,
        setStyle,
        setHighlightSameDigit,
        setMotionEffects,
        setAutoRemoveNotes,
        setShowRemainingCount,
        setMatchLauncherIconToTheme,
        setLanguage,
        setAppearance,
        setHighlightScope,
    };
});
