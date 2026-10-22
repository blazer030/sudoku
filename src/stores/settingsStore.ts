import { ref } from "vue";
import { defineStore } from "pinia";
import { loadSettings, saveSettings, type Appearance, type ColorThemeId, type LanguagePreference, type RememberedThemes, type StyleId } from "@/application/SettingsStorage";
import { rememberedThemeFor } from "@/theme/palettes";
import { launcherIconKey } from "@/theme/launcherIcon";
import { updateManifestLink, updateAppleTouchIcon } from "@/application/PwaThemeUpdater";

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
    const highlightScope = ref(settings.highlightScope);
    const colorThemeByStyle = ref<RememberedThemes>(settings.colorThemeByStyle);

    // Installed web apps keep the light icon; the favicon also follows light or dark, so appearanceSync keeps it
    const applyColorTheme = () => {
        const icon = launcherIconKey(style.value, colorTheme.value, "light");
        updateManifestLink(icon);
        updateAppleTouchIcon(icon);
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
            highlightScope: highlightScope.value,
            colorThemeByStyle: { ...colorThemeByStyle.value },
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
        setColorTheme(rememberedThemeFor(id, colorThemeByStyle.value));
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
        matchLauncherIconToTheme.value = value;
        persistAll();
    };

    const setLanguage = (value: LanguagePreference) => {
        language.value = value;
        persistAll();
    };

    const setAppearance = (value: Appearance) => {
        appearance.value = value;
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
        completionFlash,
        autoRemoveNotes,
        showRemainingCount,
        matchLauncherIconToTheme,
        language,
        appearance,
        style,
        highlightScope,
        colorThemeByStyle,
        setColorTheme,
        setStyle,
        setHighlightSameDigit,
        setCompletionFlash,
        setAutoRemoveNotes,
        setShowRemainingCount,
        setMatchLauncherIconToTheme,
        setLanguage,
        setAppearance,
        setHighlightScope,
    };
});
