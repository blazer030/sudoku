import { LAUNCHER_ICONS, launcherIconKey, launcherResourceName } from "@/theme/launcherIcon";
import { STYLES } from "@/theme/palettes";
import { ICON_THEME_IDS, STYLE_IDS } from "@/application/SettingsStorage";

describe("launcher icons", () => {
    it("should keep the bare theme id for minimal's light icons, whose aliases existing shortcuts point at", () => {
        for (const id of ICON_THEME_IDS) {
            expect(launcherIconKey("minimal", id, "light")).toBe(id);
        }
    });

    it("should name every other icon by style, theme and mode", () => {
        expect(launcherIconKey("minimal", "green", "dark")).toBe("minimalGreenDark");
        expect(launcherIconKey("tactile", "green", "light")).toBe("tactileGreen");
        expect(launcherIconKey("tactile", "rust", "dark")).toBe("tactileRustDark");
        expect(launcherIconKey("paper", "blueInk", "light")).toBe("paperBlueInk");
        expect(launcherIconKey("paper", "redInk", "dark")).toBe("paperRedInkDark");
    });

    it("should list one icon per style's theme in light and dark, each with its own key", () => {
        const themeCount = STYLE_IDS.reduce((sum, style) => sum + STYLES[style].themes.length, 0);

        expect(LAUNCHER_ICONS).toHaveLength(themeCount * 2);
        expect(new Set(LAUNCHER_ICONS.map(icon => icon.key)).size).toBe(LAUNCHER_ICONS.length);
        for (const icon of LAUNCHER_ICONS) {
            expect(icon.key).toBe(launcherIconKey(icon.style, icon.themeId, icon.mode));
        }
    });

    it("should turn a key into a lower snake case resource name", () => {
        expect(launcherResourceName("green")).toBe("ic_launcher_green");
        expect(launcherResourceName("paperBlueInkDark")).toBe("ic_launcher_paper_blue_ink_dark");
    });
});
