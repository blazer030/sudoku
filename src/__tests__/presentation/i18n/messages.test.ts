import { COLOR_THEME_IDS, STYLE_IDS } from "@/theme/themeIds";
import { en } from "@/presentation/i18n/messages/en";
import { zhHant } from "@/presentation/i18n/messages/zh-Hant";

describe("messages", () => {
    it("should name every style and theme in both languages", () => {
        for (const messages of [en, zhHant]) {
            const styleNames: Record<string, string | undefined> = messages.settings.style.names;
            const themeNames: Record<string, string | undefined> = messages.settings.colorThemes;
            for (const style of STYLE_IDS) {
                expect(styleNames[style], style).toBeTruthy();
            }
            for (const theme of COLOR_THEME_IDS) {
                expect(themeNames[theme], theme).toBeTruthy();
            }
        }
    });
});
