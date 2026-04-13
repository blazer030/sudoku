import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ThemeDef {
    id: string;
    primary: string;
}

// IMPORTANT: When adding a new theme, also update:
//   1. ColorThemeId in src/application/SettingsStorage.ts
//   2. THEMES in src/theme/themeConfig.ts
// The themeConfig.test.ts will catch mismatches between (1) and (2).
const THEMES: ThemeDef[] = [
    { id: "green",  primary: "#3D8A5A" },
    { id: "blue",   primary: "#4A7AB5" },
    { id: "purple", primary: "#7B5EA7" },
    { id: "orange", primary: "#C08040" },
    { id: "pink",   primary: "#B5607A" },
    { id: "teal",   primary: "#4A9A9A" },
];

const MANIFEST_TEMPLATE = {
    name: "Sudoku",
    short_name: "Sudoku",
    description: "Train your brain with Sudoku puzzles",
    background_color: "#F5F5F0",
    display: "standalone" as const,
};

const PUBLIC_DIR = resolve(__dirname, "../public");
const SVG_TEMPLATE_PATH = resolve(PUBLIC_DIR, "sudoku-green.svg");

const generateThemedSvg = (svgContent: string, primary: string): string =>
    svgContent.replace(/fill="#3D8A5A"/g, `fill="${primary}"`);

const generatePngFromSvg = async (svg: string, size: number): Promise<Buffer> =>
    sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

const generateManifest = (id: string, primary: string): string =>
    JSON.stringify(
        {
            ...MANIFEST_TEMPLATE,
            theme_color: primary,
            icons: [
                { src: `pwa-192x192-${id}.png`, sizes: "192x192", type: "image/png" },
                { src: `pwa-512x512-${id}.png`, sizes: "512x512", type: "image/png" },
                { src: `pwa-512x512-${id}.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
            ],
        },
        null,
        2,
    );

const main = async () => {
    mkdirSync(PUBLIC_DIR, { recursive: true });

    // Read the green SVG as the template (it has fill="#3D8A5A")
    const baseSvg = readFileSync(SVG_TEMPLATE_PATH, "utf-8");

    for (const theme of THEMES) {
        const svg = generateThemedSvg(baseSvg, theme.primary);

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
            generateManifest(theme.id, theme.primary),
        );

        console.log(`Generated assets for theme: ${theme.id}`);
    }

    console.log("Done! All themed PWA assets generated.");
};

main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
});
