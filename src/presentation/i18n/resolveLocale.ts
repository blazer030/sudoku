import type { AppLocale, LanguagePreference } from "@/application/settings/SettingsStorage";

const TRADITIONAL_REGIONS = ["tw", "hk", "mo"];

const resolveSystemLocale = (systemLanguages: readonly string[]): AppLocale => {
    const [firstLanguage] = systemLanguages;
    if (!firstLanguage) return "en";
    const [language, ...subtags] = firstLanguage.toLowerCase().split("-");
    if (language !== "zh") return "en";
    const script = subtags.find((subtag) => subtag.length === 4);
    if (script) return script === "hant" ? "zh-Hant" : "en";
    const region = subtags.find((subtag) => subtag.length === 2);
    return region && TRADITIONAL_REGIONS.includes(region) ? "zh-Hant" : "en";
};

export const resolveLocale = (
    preference: LanguagePreference,
    systemLanguages: readonly string[],
): AppLocale => (preference === "system" ? resolveSystemLocale(systemLanguages) : preference);
