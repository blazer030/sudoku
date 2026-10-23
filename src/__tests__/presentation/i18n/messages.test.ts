import { COLOR_THEME_IDS, STYLE_COLOR_MODES, STYLE_IDS, STYLE_MODE_NAMES } from "@/theme/themeIds";
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

    it("should name every mode of a style that names its own", () => {
        for (const messages of [en, zhHant]) {
            const styled: Record<string, Record<string, string | undefined> | undefined> = messages.settings.colorMode.styled;
            for (const style of STYLE_IDS.filter(candidate => STYLE_MODE_NAMES[candidate])) {
                for (const mode of STYLE_COLOR_MODES[style]) {
                    expect(styled[style]?.[mode], `${style} ${mode}`).toBeTruthy();
                }
            }
        }
    });
});
