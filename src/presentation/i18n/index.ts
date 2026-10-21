import { createI18n } from "vue-i18n";
import { en } from "./messages/en";
import { zhHant } from "./messages/zh-Hant";

export const i18n = createI18n({
    legacy: false,
    locale: "en",
    fallbackLocale: "en",
    messages: { en, "zh-Hant": zhHant },
});
