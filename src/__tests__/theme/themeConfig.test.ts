import type { ColorThemeId } from "@/application/SettingsStorage";
import { THEMES } from "@/theme/themeConfig";
import { contrastRatio } from "@/theme/contrast";

describe("themeConfig", () => {
    const ALL_THEME_IDS: ColorThemeId[] = ["green", "blue", "purple", "orange", "pink", "teal"];

    it("should have a definition for every ColorThemeId", () => {
        const ids = THEMES.map((t) => t.id);
        expect(ids).toEqual(expect.arrayContaining(ALL_THEME_IDS));
        expect(ids).toHaveLength(ALL_THEME_IDS.length);
    });

    it("should have valid hex color format for primary and accent", () => {
        const hexPattern = /^#[0-9A-Fa-f]{6}$/;
        for (const theme of THEMES) {
            expect(theme.primary).toMatch(hexPattern);
            expect(theme.accent).toMatch(hexPattern);
        }
    });

    it("should give each swatch a check colour that reads on its primary in any mode", () => {
        for (const theme of THEMES) {
            expect(contrastRatio(theme.onPrimary, theme.primary)).toBeGreaterThanOrEqual(3);
        }
    });
});
