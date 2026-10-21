import { watch, type Ref } from "vue";
import { i18n } from "@/presentation/i18n";
import { resolveLocale } from "@/presentation/i18n/resolveLocale";
import type { LanguagePreference } from "@/application/SettingsStorage";

const KNOWN_PREFERENCES: readonly LanguagePreference[] = ["system", "en", "zh-Hant"];

const readSystemLanguages = (): readonly string[] =>
    navigator.languages.length > 0 ? navigator.languages : [navigator.language];

export const startLocaleSync = (language: Ref<LanguagePreference>): (() => void) => {
    const apply = () => {
        // A hand-edited stored value falls back to following the system
        const preference = KNOWN_PREFERENCES.includes(language.value) ? language.value : "system";
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
