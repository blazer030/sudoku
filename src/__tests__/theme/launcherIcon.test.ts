import {
    ALL_LAUNCHER_ALIASES,
    LAUNCHER_ICONS,
    LEGACY_LAUNCHER_ALIASES,
    launcherIconKey,
    launcherResourceName,
} from "@/theme/launcherIcon";
import { STYLES } from "@/theme/palettes";
import { ICON_THEME_IDS, STYLE_COLOR_MODES, STYLE_IDS } from "@/theme/themeIds";

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

    it("should list one icon per style's theme in each mode the style has, each with its own key", () => {
        const iconCount = STYLE_IDS.reduce((sum, style) => sum + STYLES[style].themes.length * STYLE_COLOR_MODES[style].length, 0);

        expect(LAUNCHER_ICONS).toHaveLength(iconCount);
        expect(LAUNCHER_ICONS).toHaveLength(23);
        expect(new Set(LAUNCHER_ICONS.map(icon => icon.key)).size).toBe(LAUNCHER_ICONS.length);
        for (const icon of LAUNCHER_ICONS) {
            expect(icon.key).toBe(launcherIconKey(icon.style, icon.themeId, icon.mode));
        }
    });

    it("should give paper no dark icon now that paper is light only", () => {
        expect(LAUNCHER_ICONS.filter(icon => icon.style === "paper").map(icon => icon.mode)).toEqual(["light", "light", "light"]);
    });

    // Users who matched their icon to paper in dark sit on these aliases; removing them would
    // leave those users without a launcher entry after the update
    it("should keep the old paper dark aliases, each drawing its light twin's icon", () => {
        expect(LEGACY_LAUNCHER_ALIASES).toEqual([
            { key: "paperBlueInkDark", icon: "paperBlueInk" },
            { key: "paperGreenInkDark", icon: "paperGreenInk" },
            { key: "paperRedInkDark", icon: "paperRedInk" },
        ]);
    });

    it("should list every icon's alias and then the legacy aliases", () => {
        expect(ALL_LAUNCHER_ALIASES).toEqual([
            ...LAUNCHER_ICONS.map(icon => icon.key),
            ...LEGACY_LAUNCHER_ALIASES.map(alias => alias.key),
        ]);
    });

    it("should turn a key into a lower snake case resource name", () => {
        expect(launcherResourceName("green")).toBe("ic_launcher_green");
        expect(launcherResourceName("paperBlueInk")).toBe("ic_launcher_paper_blue_ink");
        expect(launcherResourceName("tactileRustDark")).toBe("ic_launcher_tactile_rust_dark");
    });
});
