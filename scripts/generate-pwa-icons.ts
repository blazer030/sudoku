import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { DARK_ICON_THEMES, ICON_THEMES, iconSvg, type IconTheme } from "./iconArtwork";

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

const generateManifest = (theme: IconTheme): string =>
    JSON.stringify(
        {
            ...MANIFEST_TEMPLATE,
            background_color: theme.background,
            display: "standalone",
            theme_color: theme.primary,
            icons: [
                { src: `pwa-192x192-${theme.id}.png`, sizes: "192x192", type: "image/png" },
                { src: `pwa-512x512-${theme.id}.png`, sizes: "512x512", type: "image/png" },
                { src: `pwa-512x512-${theme.id}.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
            ],
        },
        null,
        2,
    );

const main = async () => {
    mkdirSync(PUBLIC_DIR, { recursive: true });

    for (const theme of ICON_THEMES) {
        const svg = iconSvg(theme);

        // Write themed SVG favicon
        writeFileSync(resolve(PUBLIC_DIR, `sudoku-${theme.id}.svg`), svg);

        // Generate PNGs
        const [png192, png512] = await Promise.all([
            generatePngFromSvg(svg, 192),
            generatePngFromSvg(svg, 512),
        ]);
        writeFileSync(resolve(PUBLIC_DIR, `pwa-192x192-${theme.id}.png`), png192);
        writeFileSync(resolve(PUBLIC_DIR, `pwa-512x512-${theme.id}.png`), png512);
        writeFileSync(resolve(PUBLIC_DIR, `apple-touch-icon-${theme.id}.png`), png512);

        // Write manifest
        writeFileSync(
            resolve(PUBLIC_DIR, `manifest-${theme.id}.webmanifest`),
            generateManifest(theme),
        );

        console.log(`Generated assets for theme: ${theme.id}`);
    }

    // The tab icon in dark mode; installed PWA icons stay light
    for (const theme of DARK_ICON_THEMES) {
        writeFileSync(resolve(PUBLIC_DIR, `sudoku-${theme.id}-dark.svg`), iconSvg(theme));
    }

    console.log("Done! All themed PWA assets generated.");
};

main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
});
