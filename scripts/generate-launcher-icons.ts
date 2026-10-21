import sharp from "sharp";
import { mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { iconSvg } from "./iconArtwork";

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

const RES_ROOT = resolve(__dirname, "../android/app/src/main/res");

const FOREGROUND_LAYER_DP = 108;
const FOREGROUND_GRID_DP = 43.2;
const SOURCE_GRID_START = 48;
const SOURCE_GRID_SIZE = 144;
const FOREGROUND_BASE_NAME = "ic_launcher_tiles_foreground";

const FOREGROUND_DENSITIES: DensityDef[] = [
    { name: "mipmap-mdpi",    size: 108 },
    { name: "mipmap-hdpi",    size: 162 },
    { name: "mipmap-xhdpi",   size: 216 },
    { name: "mipmap-xxhdpi",  size: 324 },
    { name: "mipmap-xxxhdpi", size: 432 },
];

const tilesForegroundSvg = (svgContent: string): string => {
    const tiles = svgContent.match(/<rect x="\d+" y="\d+"[^>]*\/>/g) ?? [];
    const scale = FOREGROUND_GRID_DP / SOURCE_GRID_SIZE;
    const offset = (FOREGROUND_LAYER_DP - FOREGROUND_GRID_DP) / 2;
    return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FOREGROUND_LAYER_DP} ${FOREGROUND_LAYER_DP}">`,
        `<g transform="translate(${offset} ${offset}) scale(${scale}) translate(-${SOURCE_GRID_START} -${SOURCE_GRID_START})">`,
        ...tiles,
        "</g>",
        "</svg>",
    ].join("\n");
};

const adaptiveIconXml = (theme: ThemeDef): string => `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_${theme.id}_background"/>
    <foreground android:drawable="@mipmap/${FOREGROUND_BASE_NAME}"/>
    <monochrome android:drawable="@mipmap/${FOREGROUND_BASE_NAME}"/>
</adaptive-icon>
`;

const themeColorsXml = (): string => `<?xml version="1.0" encoding="utf-8"?>
<resources>
${THEMES.map((theme) => `    <color name="ic_launcher_${theme.id}_background">${theme.primary}</color>`).join("\n")}
</resources>
`;

const generateAdaptiveIcons = async () => {
    // The foreground keeps only the tiles, so the primary passed here does not show
    const foregroundSvg = Buffer.from(tilesForegroundSvg(iconSvg(THEMES[0].primary)));
    for (const density of FOREGROUND_DENSITIES) {
        const outDir = resolve(RES_ROOT, density.name);
        mkdirSync(outDir, { recursive: true });
        await sharp(foregroundSvg)
            .resize(density.size, density.size)
            .png()
            .toFile(resolve(outDir, `${FOREGROUND_BASE_NAME}.png`));
    }

    const xmlDir = resolve(RES_ROOT, "mipmap-anydpi-v26");
    mkdirSync(xmlDir, { recursive: true });
    for (const theme of THEMES) {
        const xml = adaptiveIconXml(theme);
        writeFileSync(resolve(xmlDir, `ic_launcher_${theme.id}.xml`), xml);
        writeFileSync(resolve(xmlDir, `ic_launcher_${theme.id}_round.xml`), xml);
    }
    writeFileSync(resolve(RES_ROOT, "values/ic_launcher_theme_colors.xml"), themeColorsXml());
    console.log("Generated adaptive launcher icons and theme colors.");
};

const main = async () => {
    await generateAdaptiveIcons();

    for (const theme of THEMES) {
        const svgBuffer = Buffer.from(iconSvg(theme.primary));

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
