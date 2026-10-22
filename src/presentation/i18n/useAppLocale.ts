import { computed, type ComputedRef } from "vue";
import { useI18n } from "vue-i18n";
import type { AppLocale } from "@/application/settings/SettingsStorage";

// The i18n instance only ever holds supported locales, so the narrowing lives here once
export const useAppLocale = (): ComputedRef<AppLocale> => {
    const { locale } = useI18n();
    return computed(() => locale.value as AppLocale);
};
