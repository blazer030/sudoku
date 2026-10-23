import { readFileSync } from "fs";
import sharp from "sharp";
import { getPalette } from "@/theme/palettes";
import { STYLE_COLOR_MODES } from "@/theme/themeIds";
import { LAUNCHER_ICONS } from "@/theme/launcherIcon";

// The PWA icons are generated files (npm run generate:icons); they must be regenerated whenever
// a primary changes. The Android launcher icons are checked in launcherIconAssets.test.ts.

// Paper has no dark palette now; its dark icon files are skipped here and deleted in Task 5.
const hasMode = (icon: (typeof LAUNCHER_ICONS)[number]): boolean => STYLE_COLOR_MODES[icon.style].includes(icon.mode);

// Every theme's icon in both modes is a favicon; installed PWAs only use the light ones
const icons = LAUNCHER_ICONS.filter(hasMode)
    .map(icon => ({ key: icon.key, palette: getPalette(icon.style, icon.themeId, icon.mode) }));
const lightIcons = LAUNCHER_ICONS.filter(icon => icon.mode === "light")
    .map(icon => ({ key: icon.key, palette: getPalette(icon.style, icon.themeId, "light") }));

const hexOf = (red: number, green: number, blue: number): string =>
    `#${[red, green, blue].map(channel => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

// A point on the left edge, halfway down: inside the rounded square, clear of the tiles
const backgroundPixel = async (path: string): Promise<string> => {
    const { data, info } = await sharp(path).raw().toBuffer({ resolveWithObject: true });
    const offset = (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 20)) * info.channels;
    return hexOf(data[offset], data[offset + 1], data[offset + 2]);
};

describe("icon assets", () => {
    it.each(icons)("should fill the $key favicon with its primary and on-primary tiles", ({ key, palette }) => {
        const svg = readFileSync(`public/sudoku-${key}.svg`, "utf8");

        expect(svg).toContain(`<rect width="240" height="240" rx="60" fill="${palette.primary}"/>`);
        expect(svg).toContain(`rx="12" fill="${palette["on-primary"]}"/>`);
    });

    it.each(lightIcons)("should give the $key web manifest the light primary and page background", ({ key, palette }) => {
        const manifest = JSON.parse(readFileSync(`public/manifest-${key}.webmanifest`, "utf8")) as Record<string, unknown>;

        expect(manifest.theme_color).toBe(palette.primary);
        expect(manifest.background_color).toBe(palette.background);
    });

    it.each(lightIcons)("should render the $key PWA icons in the light primary", async ({ key, palette }) => {
        const paths = [
            `public/pwa-192x192-${key}.png`,
            `public/pwa-512x512-${key}.png`,
            `public/apple-touch-icon-${key}.png`,
        ];

        for (const path of paths) {
            expect(await backgroundPixel(path), path).toBe(palette.primary.toUpperCase());
        }
    });
});
