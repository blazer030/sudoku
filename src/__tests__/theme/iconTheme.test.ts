import { readFileSync } from "fs";
import { ICON_THEME_IDS, THEME_IDS_BY_STYLE } from "@/application/SettingsStorage";
import { ICON_COLORS, iconThemeFor, nearestIconTheme } from "@/theme/iconTheme";
import { getPalette } from "@/theme/palettes";

describe("iconTheme", () => {
    it.each(ICON_THEME_IDS)("should map the %s icon's own colour to itself", (id) => {
        expect(nearestIconTheme(ICON_COLORS[id])).toBe(id);
    });

    it("should ignore lightness so a darkened orange stays orange", () => {
        expect(nearestIconTheme("#8C5000")).toBe("orange");
        expect(nearestIconTheme("#0B696A")).toBe("teal");
    });

    it.each([
        ["#9A4A2C", "orange"],
        ["#9E2B3A", "pink"],
        ["#3E5878", "blue"],
        ["#2B4A7A", "blue"],
    ] as const)("should map %s to the %s icon", (color, expected) => {
        expect(nearestIconTheme(color)).toBe(expected);
    });

    it("should keep every minimal theme on its own icon", () => {
        for (const id of THEME_IDS_BY_STYLE.minimal) {
            expect(iconThemeFor("minimal", id)).toBe(id);
            expect(nearestIconTheme(getPalette("minimal", id, "light").primary), id).toBe(id);
        }
    });

    it.each([
        ["green", "green"],
        ["blue", "blue"],
        ["rust", "orange"],
        ["slate", "blue"],
    ] as const)("should show the %s tactile theme with the %s icon", (theme, expected) => {
        expect(iconThemeFor("tactile", theme)).toBe(expected);
    });

    it.each([
        ["blueInk", "blue"],
        ["greenInk", "green"],
        ["redInk", "pink"],
    ] as const)("should show the %s paper theme with the %s icon", (theme, expected) => {
        expect(iconThemeFor("paper", theme)).toBe(expected);
    });

    it("should match the icon generator scripts", () => {
        // The scripts draw every launcher and PWA icon in the minimal style's light primary
        const artwork = readFileSync("scripts/iconArtwork.ts", "utf8");

        expect(artwork).toMatch(/const ICON_STYLE = "minimal";/);
        expect(artwork).toMatch(/getPalette\(ICON_STYLE,\s*theme\.id,\s*"light"\)/);
        expect(artwork).toMatch(/primary:\s*palette\.primary/);
        for (const id of ICON_THEME_IDS) {
            expect(ICON_COLORS[id], id).toBe(getPalette("minimal", id, "light").primary);
        }
    });
});
