import { nextTick, ref, type Ref } from "vue";
import { i18n } from "@/presentation/i18n";
import { startLocaleSync } from "@/presentation/i18n/localeSync";
import type { LanguagePreference } from "@/application/settings/SettingsStorage";

describe("startLocaleSync", () => {
    let stop: (() => void) | undefined;

    const mockSystemLanguages = (languages: string[]) =>
        vi.spyOn(navigator, "languages", "get").mockReturnValue(languages);

    afterEach(() => {
        stop?.();
        stop = undefined;
        vi.restoreAllMocks();
        document.documentElement.lang = "";
    });

    it("should apply the system language immediately", () => {
        mockSystemLanguages(["zh-TW"]);

        stop = startLocaleSync(ref<LanguagePreference>("system"));

        expect(i18n.global.locale.value).toBe("zh-Hant");
        expect(document.documentElement.lang).toBe("zh-Hant");
    });

    it("should follow a language change event when the preference is system", () => {
        const languages = mockSystemLanguages(["en-US"]);
        stop = startLocaleSync(ref<LanguagePreference>("system"));
        expect(i18n.global.locale.value).toBe("en");

        languages.mockReturnValue(["zh-TW"]);
        window.dispatchEvent(new Event("languagechange"));

        expect(i18n.global.locale.value).toBe("zh-Hant");
    });

    it("should ignore system language changes when a language is chosen", () => {
        const languages = mockSystemLanguages(["en-US"]);
        stop = startLocaleSync(ref<LanguagePreference>("en"));

        languages.mockReturnValue(["zh-TW"]);
        window.dispatchEvent(new Event("languagechange"));

        expect(i18n.global.locale.value).toBe("en");
    });

    it("should switch immediately when the preference changes", async () => {
        mockSystemLanguages(["en-US"]);
        const preference = ref<LanguagePreference>("system");
        stop = startLocaleSync(preference);

        preference.value = "zh-Hant";
        await nextTick();

        expect(i18n.global.locale.value).toBe("zh-Hant");
        expect(document.documentElement.lang).toBe("zh-Hant");
    });

    it("should treat an unknown preference as system", () => {
        mockSystemLanguages(["zh-TW"]);

        stop = startLocaleSync(ref("fr") as unknown as Ref<LanguagePreference>);

        expect(i18n.global.locale.value).toBe("zh-Hant");
    });

    it("should stop listening after the returned stop function is called", async () => {
        const languages = mockSystemLanguages(["en-US"]);
        const preference = ref<LanguagePreference>("system");
        const stopSync = startLocaleSync(preference);
        stopSync();

        languages.mockReturnValue(["zh-TW"]);
        window.dispatchEvent(new Event("languagechange"));
        preference.value = "zh-Hant";
        await nextTick();

        expect(i18n.global.locale.value).toBe("en");
    });
});
