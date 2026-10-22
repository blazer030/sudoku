import { readFileSync } from "fs";
import sharp from "sharp";
import { getPalette, STYLES } from "@/theme/palettes";

// The launcher and PWA icons are generated files (npm run generate:icons and
// generate:launcher-icons); they must be regenerated whenever a light primary changes.

const ICON_STYLE = "minimal";
const themes = STYLES[ICON_STYLE].themes.map(theme => ({ id: theme.id, palette: getPalette(ICON_STYLE, theme.id, "light") }));
const darkThemes = STYLES[ICON_STYLE].themes.map(theme => ({ id: theme.id, palette: getPalette(ICON_STYLE, theme.id, "dark") }));
const RES_ROOT = "android/app/src/main/res";
const DENSITIES = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];

const hexOf = (red: number, green: number, blue: number): string =>
    `#${[red, green, blue].map(channel => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

// A point on the left edge, halfway down: inside the rounded square, clear of the tiles
const backgroundPixel = async (path: string): Promise<string> => {
    const { data, info } = await sharp(path).raw().toBuffer({ resolveWithObject: true });
    const offset = (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 20)) * info.channels;
    return hexOf(data[offset], data[offset + 1], data[offset + 2]);
};

// The middle of the top row's solid tile in the 108dp adaptive foreground layer
const solidTilePixel = async (path: string): Promise<{ color: string; alpha: number }> => {
    const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const offset = (Math.round(info.height * 38.4 / 108) * info.width + Math.round(info.width / 2)) * info.channels;
    return { color: hexOf(data[offset], data[offset + 1], data[offset + 2]), alpha: data[offset + 3] };
};

describe("icon assets", () => {
    it.each(themes)("should fill the $id favicon with the theme's light primary", ({ id, palette }) => {
        const svg = readFileSync(`public/sudoku-${id}.svg`, "utf8");

        expect(svg).toContain(`<rect width="240" height="240" rx="60" fill="${palette.primary}"/>`);
    });

    it.each(themes)("should give the $id web manifest the light primary and page background", ({ id, palette }) => {
        const manifest = JSON.parse(readFileSync(`public/manifest-${id}.webmanifest`, "utf8")) as Record<string, unknown>;

        expect(manifest.theme_color).toBe(palette.primary);
        expect(manifest.background_color).toBe(palette.background);
    });

    it.each(themes)("should render the $id PWA and legacy launcher icons in the light primary", async ({ id, palette }) => {
        const paths = [
            `public/pwa-192x192-${id}.png`,
            `public/pwa-512x512-${id}.png`,
            `public/apple-touch-icon-${id}.png`,
            `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_${id}.png`,
            `android/app/src/main/res/mipmap-mdpi/ic_launcher_${id}_round.png`,
        ];

        for (const path of paths) {
            expect(await backgroundPixel(path), path).toBe(palette.primary.toUpperCase());
        }
    });

    it("should back each adaptive launcher icon with the theme's light primary", () => {
        const colors = readFileSync("android/app/src/main/res/values/ic_launcher_theme_colors.xml", "utf8");

        for (const { id, palette } of themes) {
            expect(colors).toContain(`<color name="ic_launcher_${id}_background">${palette.primary}</color>`);
        }
    });

    // Launchers resolve the icon in the system's configuration, so -night resources follow the system dark theme
    it("should back each adaptive launcher icon with the theme's dark primary when the system is dark", () => {
        const colors = readFileSync(`${RES_ROOT}/values-night/ic_launcher_theme_colors.xml`, "utf8");

        for (const { id, palette } of darkThemes) {
            expect(colors).toContain(`<color name="ic_launcher_${id}_background">${palette.primary}</color>`);
        }
    });

    it("should draw the adaptive icon's tiles in the light on-primary by day and the dark on-primary at night", async () => {
        for (const density of DENSITIES) {
            const day = await solidTilePixel(`${RES_ROOT}/mipmap-${density}/ic_launcher_tiles_foreground.png`);
            const night = await solidTilePixel(`${RES_ROOT}/mipmap-night-${density}/ic_launcher_tiles_foreground.png`);

            expect(day, density).toEqual({ color: themes[0].palette["on-primary"].toUpperCase(), alpha: 255 });
            expect(night, density).toEqual({ color: darkThemes[0].palette["on-primary"].toUpperCase(), alpha: 255 });
        }
        // One foreground serves every theme, so they must agree on the tile colour
        expect(new Set(darkThemes.map(({ palette }) => palette["on-primary"])).size).toBe(1);
    });
});
