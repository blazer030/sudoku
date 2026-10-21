import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ThemeDef {
    id: string;
    primary: string;
}

const THEMES: ThemeDef[] = [
    { id: "green",  primary: "#3D8A5A" },
    { id: "blue",   primary: "#4A7AB5" },
    { id: "purple", primary: "#7B5EA7" },
    { id: "orange", primary: "#C08040" },
    { id: "pink",   primary: "#B5607A" },
    { id: "teal",   primary: "#4A9A9A" },
];

interface DensityDef {
    name: string;
    size: number;
}

const DENSITIES: DensityDef[] = [
    { name: "mipmap-mdpi",    size: 48 },
    { name: "mipmap-hdpi",    size: 72 },
    { name: "mipmap-xhdpi",   size: 96 },
    { name: "mipmap-xxhdpi",  size: 144 },
    { name: "mipmap-xxxhdpi", size: 192 },
];

const PUBLIC_DIR = resolve(__dirname, "../public");
const RES_ROOT = resolve(__dirname, "../android/app/src/main/res");
const SVG_TEMPLATE_PATH = resolve(PUBLIC_DIR, "sudoku-green.svg");

const themedSvg = (svgContent: string, primary: string): string =>
    svgContent.replace(/fill="#3D8A5A"/g, `fill="${primary}"`);

const main = async () => {
    const baseSvg = readFileSync(SVG_TEMPLATE_PATH, "utf-8");

    for (const theme of THEMES) {
        const svgBuffer = Buffer.from(themedSvg(baseSvg, theme.primary));

        for (const density of DENSITIES) {
            const outDir = resolve(RES_ROOT, density.name);
            mkdirSync(outDir, { recursive: true });

            const png = await sharp(svgBuffer)
                .resize(density.size, density.size)
                .png()
                .toBuffer();

            const baseName = `ic_launcher_${theme.id}`;
            await sharp(png).toFile(resolve(outDir, `${baseName}.png`));
            await sharp(png).toFile(resolve(outDir, `${baseName}_round.png`));
        }

        console.log(`Generated launcher icons for theme: ${theme.id}`);
    }

    console.log(`Done! ${THEMES.length * DENSITIES.length * 2} launcher PNGs generated.`);
};

main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
});
