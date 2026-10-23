import { readdirSync, readFileSync } from "fs";
import sharp from "sharp";
import { getPalette } from "@/theme/palettes";
import { LAUNCHER_ICONS } from "@/theme/launcherIcon";
import { styleIconBackground, styleIconSvg } from "@/theme/styleIcons";

// The PWA icons are generated files (npm run generate:icons); they must be regenerated whenever
// a palette or the artwork in styleIcons.ts changes. The Android launcher icons are checked in
// launcherIconAssets.test.ts.

// Every icon is a favicon; installed PWAs only use the light ones
const icons = LAUNCHER_ICONS.map(icon => ({ ...icon, palette: getPalette(icon.style, icon.themeId, icon.mode) }));
const lightIcons = icons.filter(icon => icon.mode === "light");

const hexOf = (red: number, green: number, blue: number): string =>
    `#${[red, green, blue].map(channel => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

// A point on the left edge, halfway down: inside the rounded square, clear of every style's drawing
const backgroundPixel = async (path: string): Promise<string> => {
    const { data, info } = await sharp(path).raw().toBuffer({ resolveWithObject: true });
    const offset = (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 20)) * info.channels;
    return hexOf(data[offset], data[offset + 1], data[offset + 2]);
};

describe("icon assets", () => {
    it.each(icons)("should draw the $key favicon as its style's artwork in a rounded square", ({ key, style, palette }) => {
        const svg = readFileSync(`public/sudoku-${key}.svg`, "utf8");

        expect(svg).toContain(`<clipPath id="icon-shape"><rect width="108" height="108" rx="27"/></clipPath>`);
        expect(svg).toContain(styleIconSvg(style, palette).trimEnd());
    });

    it("should leave no paper dark favicons behind", () => {
        expect(readdirSync("public").filter(file => /^sudoku-paper\w+Dark\.svg$/.test(file))).toEqual([]);
    });

    it.each(lightIcons)("should give the $key web manifest the light primary and page background", ({ key, palette }) => {
        const manifest = JSON.parse(readFileSync(`public/manifest-${key}.webmanifest`, "utf8")) as Record<string, unknown>;

        expect(manifest.theme_color).toBe(palette.primary);
        expect(manifest.background_color).toBe(palette.background);
    });

    it.each(lightIcons)("should render the $key PWA icons on the colour behind their artwork", async ({ key, style, palette }) => {
        const paths = [
            `public/pwa-192x192-${key}.png`,
            `public/pwa-512x512-${key}.png`,
            `public/apple-touch-icon-${key}.png`,
        ];

        for (const path of paths) {
            expect(await backgroundPixel(path), path).toBe(styleIconBackground(style, palette).toUpperCase());
        }
    });
});
