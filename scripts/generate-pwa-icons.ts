import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { ICON_VARIANTS, roundedIconSvg, type IconVariant } from "./iconArtwork";
import { LAUNCHER_ICONS, pwaIconKey } from "../src/theme/launcherIcon";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MANIFEST_TEMPLATE = {
    name: "Sudoku",
    short_name: "Sudoku",
    description: "Train your brain with Sudoku puzzles",
};

const PUBLIC_DIR = resolve(__dirname, "../public");

const generatePngFromSvg = async (svg: string, size: number): Promise<Buffer> =>
    sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

const generateManifest = ({ id, palette }: IconVariant): string =>
    JSON.stringify(
        {
            ...MANIFEST_TEMPLATE,
            background_color: palette.background,
            display: "standalone",
            theme_color: palette.primary,
            icons: [
                { src: `pwa-192x192-${id}.png`, sizes: "192x192", type: "image/png" },
                { src: `pwa-512x512-${id}.png`, sizes: "512x512", type: "image/png" },
                { src: `pwa-512x512-${id}.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
            ],
        },
        null,
        2,
    );

// Installed web apps keep the light icon (or the style's only one), so only those get a manifest and PNGs
const PWA_KEYS = new Set(LAUNCHER_ICONS.filter(icon => icon.key === pwaIconKey(icon.style, icon.themeId)).map(icon => icon.key));

const main = async () => {
    mkdirSync(PUBLIC_DIR, { recursive: true });

    for (const variant of ICON_VARIANTS) {
        const svg = roundedIconSvg(variant);
        writeFileSync(resolve(PUBLIC_DIR, `sudoku-${variant.id}.svg`), svg);
        if (!PWA_KEYS.has(variant.id)) continue;

        const [png192, png512] = await Promise.all([
            generatePngFromSvg(svg, 192),
            generatePngFromSvg(svg, 512),
        ]);
        writeFileSync(resolve(PUBLIC_DIR, `pwa-192x192-${variant.id}.png`), png192);
        writeFileSync(resolve(PUBLIC_DIR, `pwa-512x512-${variant.id}.png`), png512);
        writeFileSync(resolve(PUBLIC_DIR, `apple-touch-icon-${variant.id}.png`), png512);
        writeFileSync(resolve(PUBLIC_DIR, `manifest-${variant.id}.webmanifest`), generateManifest(variant));
    }

    console.log(`Done! ${ICON_VARIANTS.length} favicons and ${PWA_KEYS.size} PWA icon sets generated.`);
};

main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
});
