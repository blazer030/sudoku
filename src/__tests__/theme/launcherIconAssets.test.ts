import { readdirSync, readFileSync } from "fs";
import sharp from "sharp";
import { getPalette } from "@/theme/palettes";
import { ALL_LAUNCHER_ALIASES, LAUNCHER_ICONS, LEGACY_LAUNCHER_ALIASES, launcherResourceName } from "@/theme/launcherIcon";
import { styleIconBackground } from "@/theme/styleIcons";
import { ICON_THEME_IDS, type ColorMode, type StyleId } from "@/theme/themeIds";
import type { Palette, PaletteToken } from "@/theme/palettes";

// The Android launcher icons are generated (npm run generate:launcher-icons); regenerate them
// whenever a palette or the artwork in styleIcons.ts changes.

const RES_ROOT = "android/app/src/main/res";
const MANIFEST = "android/app/src/main/AndroidManifest.xml";
const DENSITIES = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];

const icons = LAUNCHER_ICONS.map((icon) => {
    const palette = getPalette(icon.style, icon.themeId, icon.mode);
    return { ...icon, name: launcherResourceName(icon.key), palette };
});

// Minimal's themes share one tile foreground per tile colour; tactile and paper have one per icon
const foregroundName = ({ key, style, palette }: { key: string; style: StyleId; palette: Palette }): string => style === "minimal"
    ? `ic_launcher_tiles_${palette["on-primary"].slice(1).toLowerCase()}_foreground`
    : `${launcherResourceName(key)}_foreground`;
const monochromeName = (style: StyleId): string => `ic_launcher_${style}_monochrome`;

const hexOf = (red: number, green: number, blue: number): string =>
    `#${[red, green, blue].map(channel => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

// Samples the pixel at a fraction of the image's width and height
const pixelAt = async (path: string, across: number, down: number): Promise<{ color: string; alpha: number }> => {
    const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const offset = (Math.round(info.height * down) * info.width + Math.round(info.width * across)) * info.channels;
    return { color: hexOf(data[offset], data[offset + 1], data[offset + 2]), alpha: data[offset + 3] };
};

// Points on each style's 108-unit artwork and the colour drawn there. The legacy icon shows the
// artwork whole; the 108dp foreground layer shows it in its middle 72dp. Fine points sit on strokes
// too thin to fill a whole pixel below xxxhdpi. A point outside 0..108 lies in the foreground
// layer's bleed past the 72dp viewport.
interface ArtworkSample {
    x: number;
    y: number;
    token: PaletteToken;
    mode?: ColorMode;
    legacyOnly?: boolean;
    foregroundOnly?: boolean;
    fine?: boolean;
}
const SAMPLES: Record<StyleId, ArtworkSample[]> = {
    minimal: [
        { x: 5.4, y: 54, token: "primary", legacyOnly: true },
        { x: 54, y: 30.6, token: "on-primary" },
    ],
    tactile: [
        { x: 5.4, y: 54, token: "background" },
        { x: -20, y: 54, token: "background", foregroundOnly: true },
        { x: 31, y: 31, token: "card", mode: "light" },
        { x: 31, y: 31, token: "cell-clue", mode: "dark" },
        { x: 54, y: 46.5, token: "primary" },
    ],
    paper: [
        { x: 54, y: 13, token: "background" },
        { x: 54, y: -20, token: "background", foregroundOnly: true },
        { x: 63, y: 28.4, token: "primary", fine: true },
        { x: 24, y: 40, token: "margin-line", fine: true },
        { x: 24, y: -19.5, token: "margin-line", fine: true, foregroundOnly: true },
        { x: 55.5, y: 57.5, token: "danger", fine: true },
    ],
    pixel: [
        { x: 5.4, y: 54, token: "background" },
        { x: -20, y: 54, token: "background", foregroundOnly: true },
        // The centre cell's fill, left of its 5
        { x: 46, y: 62, token: "highlight", mode: "light" },
        { x: 46, y: 62, token: "card", mode: "dark" },
        // The box's left line
        { x: 21, y: 40, token: "foreground", fine: true },
    ],
    cyber: [
        { x: 5.4, y: 54, token: "background" },
        { x: -20, y: 54, token: "background", foregroundOnly: true },
        // The cursor bar's yellow bracket; the glowing parts blur, so a rasteriser's rounding moves their colours
        { x: 42, y: 47, token: "signal", fine: true },
    ],
};
const samplesAt = (style: StyleId, mode: ColorMode, density: string) => SAMPLES[style]
    .filter(sample => (!sample.fine || density === "xxxhdpi") && (!sample.mode || sample.mode === mode));
const inForeground = (point: number): number => (18 + point * 72 / 108) / 108;

const manifestAliases = (): { alias: string; icon: string }[] =>
    [...readFileSync(MANIFEST, "utf8").matchAll(/<activity-alias\s[^>]*?android:name="\.(\w+)"[^>]*?android:icon="@mipmap\/(\w+)"/g)]
        .map(([, alias, icon]) => ({ alias, icon }));

describe("launcher icon assets", () => {
    it("should back each adaptive icon with the colour behind its style's artwork", () => {
        const colors = readFileSync(`${RES_ROOT}/values/ic_launcher_theme_colors.xml`, "utf8");

        for (const { name, style, palette } of icons) {
            expect(colors, name).toContain(`<color name="${name}_background">${styleIconBackground(style, palette)}</color>`);
        }
    });

    it("should layer each adaptive icon's foreground and its style's monochrome", () => {
        for (const icon of icons) {
            const xml = readFileSync(`${RES_ROOT}/mipmap-anydpi-v26/${icon.name}.xml`, "utf8");

            expect(xml, icon.name).toContain(`<background android:drawable="@color/${icon.name}_background"/>`);
            expect(xml, icon.name).toContain(`<foreground android:drawable="@mipmap/${foregroundName(icon)}"/>`);
            expect(xml, icon.name).toContain(`<monochrome android:drawable="@mipmap/${monochromeName(icon.style)}"/>`);
        }
    });

    it("should draw each foreground's artwork in its palette at every density", async () => {
        for (const icon of icons) {
            for (const density of DENSITIES) {
                const path = `${RES_ROOT}/mipmap-${density}/${foregroundName(icon)}.png`;

                for (const { x, y, token } of samplesAt(icon.style, icon.mode, density).filter(sample => !sample.legacyOnly)) {
                    expect(await pixelAt(path, inForeground(x), inForeground(y)), `${path} ${token}`)
                        .toEqual({ color: icon.palette[token].toUpperCase(), alpha: 255 });
                }
            }
        }
    });

    it("should render each legacy icon as its style's artwork in its palette at every density", async () => {
        for (const icon of icons) {
            for (const density of DENSITIES) {
                const path = `${RES_ROOT}/mipmap-${density}/${icon.name}.png`;

                for (const { x, y, token } of samplesAt(icon.style, icon.mode, density).filter(sample => !sample.foregroundOnly)) {
                    expect(await pixelAt(path, x / 108, y / 108), `${path} ${token}`)
                        .toEqual({ color: icon.palette[token].toUpperCase(), alpha: 255 });
                }
            }
        }
    });

    it("should keep each style's monochrome layer at every density", () => {
        for (const style of new Set(icons.map(icon => icon.style))) {
            for (const density of DENSITIES) {
                expect(readdirSync(`${RES_ROOT}/mipmap-${density}`), density).toContain(`${monochromeName(style)}.png`);
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

    it("should keep only the foreground and monochrome layers some adaptive icon uses", () => {
        const xmlDirectory = `${RES_ROOT}/mipmap-anydpi-v26`;
        const usedLayers = new Set(readdirSync(xmlDirectory)
            .flatMap(file => [...readFileSync(`${xmlDirectory}/${file}`, "utf8").matchAll(/@mipmap\/(\w+)/g)])
            .map(([, layer]) => `${layer}.png`));
        for (const density of DENSITIES) {
            const layers = readdirSync(`${RES_ROOT}/mipmap-${density}`).filter(file => /_(foreground|monochrome)\.png$/.test(file));

            expect(layers.filter(file => !usedLayers.has(file)), density).toEqual([]);
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
