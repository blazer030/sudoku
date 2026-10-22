import { watch, type Ref } from "vue";
import { i18n } from "@/presentation/i18n";
import { resolveLocale } from "@/presentation/i18n/resolveLocale";
import { LANGUAGE_PREFERENCES, type LanguagePreference } from "@/application/settings/SettingsStorage";

const readSystemLanguages = (): readonly string[] =>
    navigator.languages.length > 0 ? navigator.languages : [navigator.language];

export const startLocaleSync = (language: Ref<LanguagePreference>): (() => void) => {
    const apply = () => {
        // A hand-edited stored value falls back to following the system
        const preference = LANGUAGE_PREFERENCES.includes(language.value) ? language.value : "system";
        const locale = resolveLocale(preference, readSystemLanguages());
        i18n.global.locale.value = locale;
        document.documentElement.lang = locale;
    };

    const stopWatching = watch(language, apply, { immediate: true });
    window.addEventListener("languagechange", apply);

    return () => {
        stopWatching();
        window.removeEventListener("languagechange", apply);
    };
};
