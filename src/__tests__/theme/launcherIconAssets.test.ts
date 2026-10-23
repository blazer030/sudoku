import { readdirSync, readFileSync } from "fs";
import sharp from "sharp";
import { getPalette } from "@/theme/palettes";
import { ALL_LAUNCHER_ALIASES, LAUNCHER_ICONS, LEGACY_LAUNCHER_ALIASES, launcherResourceName } from "@/theme/launcherIcon";
import { ICON_THEME_IDS } from "@/theme/themeIds";

// The Android launcher icons are generated (npm run generate:launcher-icons); regenerate them
// whenever a primary or on-primary in palettes.ts changes.

const RES_ROOT = "android/app/src/main/res";
const MANIFEST = "android/app/src/main/AndroidManifest.xml";
const DENSITIES = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];

const icons = LAUNCHER_ICONS.map((icon) => {
    const palette = getPalette(icon.style, icon.themeId, icon.mode);
    return {
        ...icon,
        name: launcherResourceName(icon.key),
        primary: palette.primary.toUpperCase(),
        onPrimary: palette["on-primary"].toUpperCase(),
    };
});

const foregroundName = (onPrimary: string): string => `ic_launcher_tiles_${onPrimary.slice(1).toLowerCase()}_foreground`;

const hexOf = (red: number, green: number, blue: number): string =>
    `#${[red, green, blue].map(channel => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

// Samples the pixel at a fraction of the image's width and height
const pixelAt = async (path: string, across: number, down: number): Promise<{ color: string; alpha: number }> => {
    const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const offset = (Math.round(info.height * down) * info.width + Math.round(info.width * across)) * info.channels;
    return { color: hexOf(data[offset], data[offset + 1], data[offset + 2]), alpha: data[offset + 3] };
};

// The top row's solid tile sits at (100..140, 48..88) of the 240 artwork, and the 108dp
// foreground layer draws the 144-wide tile grid 43.2dp wide in its centre
const LEGACY_BACKGROUND = [0.05, 0.5] as const;
const LEGACY_SOLID_TILE = [0.5, 68 / 240] as const;
const FOREGROUND_SOLID_TILE = [0.5, 38.4 / 108] as const;

const manifestAliases = (): { alias: string; icon: string }[] =>
    [...readFileSync(MANIFEST, "utf8").matchAll(/<activity-alias\s[^>]*?android:name="\.(\w+)"[^>]*?android:icon="@mipmap\/(\w+)"/g)]
        .map(([, alias, icon]) => ({ alias, icon }));

describe("launcher icon assets", () => {
    it("should back each adaptive icon with its theme's primary in that mode", () => {
        const colors = readFileSync(`${RES_ROOT}/values/ic_launcher_theme_colors.xml`, "utf8");

        for (const { name, primary } of icons) {
            expect(colors, name).toContain(`<color name="${name}_background">${primary}</color>`);
        }
    });

    it("should layer each adaptive icon's tiles in its palette's on-primary", () => {
        for (const { name, onPrimary } of icons) {
            const xml = readFileSync(`${RES_ROOT}/mipmap-anydpi-v26/${name}.xml`, "utf8");

            expect(xml, name).toContain(`<background android:drawable="@color/${name}_background"/>`);
            expect(xml, name).toContain(`<foreground android:drawable="@mipmap/${foregroundName(onPrimary)}"/>`);
            expect(xml, name).toContain(`<monochrome android:drawable="@mipmap/${foregroundName(onPrimary)}"/>`);
        }
    });

    it("should draw each tile foreground's solid tiles in its colour at every density", async () => {
        for (const onPrimary of new Set(icons.map(icon => icon.onPrimary))) {
            for (const density of DENSITIES) {
                const path = `${RES_ROOT}/mipmap-${density}/${foregroundName(onPrimary)}.png`;

                expect(await pixelAt(path, ...FOREGROUND_SOLID_TILE), path).toEqual({ color: onPrimary, alpha: 255 });
            }
        }
    });

    it("should render each legacy icon in its primary with on-primary tiles at every density", async () => {
        for (const { name, primary, onPrimary } of icons) {
            for (const density of DENSITIES) {
                const path = `${RES_ROOT}/mipmap-${density}/${name}.png`;

                expect(await pixelAt(path, ...LEGACY_BACKGROUND), path).toEqual({ color: primary, alpha: 255 });
                expect(await pixelAt(path, ...LEGACY_SOLID_TILE), path).toEqual({ color: onPrimary, alpha: 255 });
            }
        }
    });

    it("should declare one launcher alias per icon and per legacy alias, keeping minimal's light alias names", () => {
        const aliases = manifestAliases();

        expect(aliases.map(({ alias }) => alias)).toEqual(ALL_LAUNCHER_ALIASES);
        for (const { key, name } of icons) {
            expect(aliases, key).toContainEqual({ alias: key, icon: name });
        }
        for (const id of ICON_THEME_IDS) {
            expect(aliases.map(({ alias }) => alias)).toContain(id);
        }
    });

    it("should draw each legacy alias with its light twin's icon", () => {
        const aliases = manifestAliases();

        for (const { key, icon } of LEGACY_LAUNCHER_ALIASES) {
            expect(aliases, key).toContainEqual({ alias: key, icon: launcherResourceName(icon) });
        }
    });

    it("should leave no paper dark icon resources behind", () => {
        const paperDarkResources = readdirSync(RES_ROOT)
            .filter(directory => directory.startsWith("mipmap"))
            .flatMap(directory => readdirSync(`${RES_ROOT}/${directory}`).map(file => `${directory}/${file}`))
            .filter(path => /ic_launcher_paper_\w+_dark\./.test(path));
        const colors = readFileSync(`${RES_ROOT}/values/ic_launcher_theme_colors.xml`, "utf8");

        expect(paperDarkResources).toEqual([]);
        expect(colors).not.toMatch(/ic_launcher_paper_\w+_dark_background/);
    });

    it("should keep only the tile foregrounds some icon uses", () => {
        const usedForegrounds = new Set(icons.map(({ onPrimary }) => `${foregroundName(onPrimary)}.png`));
        for (const density of DENSITIES) {
            const foregrounds = readdirSync(`${RES_ROOT}/mipmap-${density}`).filter(file => file.startsWith("ic_launcher_tiles_"));

            expect(foregrounds.filter(file => !usedForegrounds.has(file)), density).toEqual([]);
        }
    });

    // Launchers cache icons in whatever system mode they were drawn, so mode lives in the alias instead
    it("should leave no -night launcher resources for the system mode to mix in", () => {
        const nightResources = readdirSync(RES_ROOT)
            .filter(directory => /-night\b/.test(directory))
            .flatMap(directory => readdirSync(`${RES_ROOT}/${directory}`).map(file => `${directory}/${file}`));

        expect(nightResources).toEqual([]);
    });
});
