import {
    ALL_LAUNCHER_ALIASES,
    LAUNCHER_ICONS,
    LEGACY_LAUNCHER_ALIASES,
    launcherIconKey,
    pwaIconKey,
    launcherResourceName,
} from "@/theme/launcherIcon";
import { STYLES } from "@/theme/palettes";
import { ICON_THEME_IDS, STYLE_COLOR_MODES, STYLE_IDS } from "@/theme/themeIds";

describe("launcher icons", () => {
    it("should name the icon an installed web app uses: the light one, or the style's only one", () => {
        expect(pwaIconKey("paper", "blueInk")).toBe("paperBlueInk");
        expect(pwaIconKey("minimal", "green")).toBe("green");
        expect(pwaIconKey("pixel", "classic")).toBe("pixelClassic");
        expect(pwaIconKey("cyber", "neon")).toBe("cyberNeonDark");
        expect(pwaIconKey("ink", "vermilion")).toBe("inkVermilion");
        expect(pwaIconKey("chalkboard", "classic")).toBe("chalkboardClassic");
        expect(pwaIconKey("blueprint", "slate")).toBe("blueprintSlate");
        expect(pwaIconKey("aurora", "teal")).toBe("auroraTeal");
    });

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
        expect(launcherIconKey("pixel", "classic", "light")).toBe("pixelClassic");
        expect(launcherIconKey("pixel", "classic", "dark")).toBe("pixelClassicDark");
    });

    it("should list one icon per style's theme in each mode the style has, each with its own key", () => {
        const iconCount = STYLE_IDS.reduce((sum, style) => sum + STYLES[style].themes.length * STYLE_COLOR_MODES[style].length, 0);

        expect(LAUNCHER_ICONS).toHaveLength(iconCount);
        expect(LAUNCHER_ICONS).toHaveLength(45);
        expect(new Set(LAUNCHER_ICONS.map(icon => icon.key)).size).toBe(LAUNCHER_ICONS.length);
        for (const icon of LAUNCHER_ICONS) {
            expect(icon.key).toBe(launcherIconKey(icon.style, icon.themeId, icon.mode));
        }
    });

    it("should give pixel a handheld and a console icon", () => {
        expect(LAUNCHER_ICONS.filter(icon => icon.style === "pixel").map(icon => icon.key)).toEqual(["pixelClassic", "pixelClassicDark"]);
    });

    it("should give cyber its one dark icon and no light one", () => {
        const keys = LAUNCHER_ICONS.map(icon => icon.key);

        expect(keys).toContain("cyberNeonDark");
        expect(keys).not.toContain("cyberNeon");
    });

    it("should give ink its one light icon and no dark one", () => {
        const keys = LAUNCHER_ICONS.map(icon => icon.key);

        expect(keys).toContain("inkVermilion");
        expect(keys).not.toContain("inkVermilionDark");
    });

    it("should give chalkboard a whiteboard and a chalkboard icon", () => {
        const keys = LAUNCHER_ICONS.map(icon => icon.key);

        expect(keys).toContain("chalkboardClassic");
        expect(keys).toContain("chalkboardClassicDark");
    });

    it("should give blueprint a drafting paper and a blueprint icon for each of its papers", () => {
        const keys = LAUNCHER_ICONS.map(icon => icon.key);

        for (const key of [
            "blueprintBlue", "blueprintBlueDark", "blueprintTeal", "blueprintTealDark",
            "blueprintSlate", "blueprintSlateDark", "blueprintRust", "blueprintRustDark",
        ]) {
            expect(keys, key).toContain(key);
        }
    });

    it("should give aurora a dawn and a night sky icon for each of its four colours", () => {
        const keys = LAUNCHER_ICONS.map(icon => icon.key);

        for (const key of [
            "auroraPurple", "auroraPurpleDark", "auroraTeal", "auroraTealDark",
            "auroraPink", "auroraPinkDark", "auroraOrange", "auroraOrangeDark",
        ]) {
            expect(keys, key).toContain(key);
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

    it("should not repeat a launcher alias", () => {
        expect(new Set(ALL_LAUNCHER_ALIASES).size).toBe(ALL_LAUNCHER_ALIASES.length);
    });

    it("should turn a key into a lower snake case resource name", () => {
        expect(launcherResourceName("green")).toBe("ic_launcher_green");
        expect(launcherResourceName("paperBlueInk")).toBe("ic_launcher_paper_blue_ink");
        expect(launcherResourceName("tactileRustDark")).toBe("ic_launcher_tactile_rust_dark");
    });
});
