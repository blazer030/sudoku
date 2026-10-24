// Bundles the app's web fonts so every style reads the same offline (the Android app often has
// no network). Downloads the pinned Google Fonts sources, cuts each down to the characters the app
// writes, and writes woff2 files to src/assets/fonts/ and each family's licence to
// public/fonts/licenses/, which the build copies as is into dist/.
// Run with `npm run generate:fonts` after changing any copy that adds new Chinese characters;
// bundledFonts.test.ts fails until the WenKai subset covers them.
import subsetFont from "subset-font";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIR = join(ROOT, "src/assets/fonts");
const LICENCE_DIR = join(ROOT, "public/fonts/licenses");
// The licence description and URL; the subsetter drops them from the name table unless asked
const LICENCE_NAME_IDS = [13, 14];
const CACHE_DIR = join(ROOT, "node_modules/.cache/sudoku-fonts");

// google/fonts on 2026-10-21; bump to pick up upstream fixes
const GOOGLE_FONTS_COMMIT = "45e3d5269e4a17d823f6d84470bc084dc5ae46f6";
const sourceUrl = (path: string): string => `https://raw.githubusercontent.com/google/fonts/${GOOGLE_FONTS_COMMIT}/${path}`;

// Cubic 11 (俐方體 11 號) is not on Google Fonts; pinned by commit like the rest
const CUBIC_11_COMMIT = "4c566f7d6cc5c05ee360fe9cff56b5da1fcafd4d";
const cubicUrl = (path: string): string => `https://raw.githubusercontent.com/ACh-K/Cubic-11/${CUBIC_11_COMMIT}/${path}`;

const rangeText = (first: number, last: number): string =>
    Array.from({ length: last - first + 1 }, (_, offset) => String.fromCodePoint(first + offset)).join("");

const ASCII = rangeText(0x20, 0x7e);
// Latin-1 letters and signs, and general punctuation such as dashes, curly quotes and ellipses
const LATIN = ASCII + rangeText(0xa0, 0xff) + rangeText(0x2010, 0x2027) + rangeText(0x2030, 0x205e);

/** Every non-ASCII character in the app's own source, which is all the Chinese copy it can show. */
const sourceCharacters = (): string => {
    const characters = new Set<string>();
    const visit = (directory: string): void => {
        for (const name of readdirSync(directory)) {
            const path = join(directory, name);
            if (statSync(path).isDirectory()) {
                if (name !== "__tests__") visit(path);
            } else if (/\.(?:ts|vue)$/.test(name)) {
                for (const character of readFileSync(path, "utf8")) {
                    if ((character.codePointAt(0) ?? 0) > 0x7e) characters.add(character);
                }
            }
        }
    };
    visit(join(ROOT, "src"));
    return [...characters].sort().join("");
};

interface FontJob {
    output: string;
    source: string;
    text: string;
    weights?: { min: number; max: number };
}

interface Family {
    licence: string;
    fetch?: (path: string) => Promise<Buffer>;
    licenceOutput: string;
    jobs: FontJob[];
}

// Fetches a pinned file once and keeps it under the cache, so a rerun works offline
const downloadCached = async (url: string, cacheKey: string): Promise<Buffer> => {
    const cached = join(CACHE_DIR, cacheKey);
    if (existsSync(cached)) return readFileSync(cached);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not download ${url}: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    mkdirSync(dirname(cached), { recursive: true });
    writeFileSync(cached, buffer);
    return buffer;
};

const download = (path: string): Promise<Buffer> => downloadCached(sourceUrl(path), join(GOOGLE_FONTS_COMMIT, path));
const downloadCubic = (path: string): Promise<Buffer> => downloadCached(cubicUrl(path), join("cubic-11", CUBIC_11_COMMIT, path));

const main = async (): Promise<void> => {
    const chineseText = ASCII + sourceCharacters();
    const families: Family[] = [
        {
            licence: "ofl/outfit/OFL.txt",
            licenceOutput: "Outfit-OFL.txt",
            jobs: [{ output: "outfit.woff2", source: "ofl/outfit/Outfit[wght].ttf", text: LATIN, weights: { min: 400, max: 700 } }],
        },
        {
            licence: "ofl/robotomono/OFL.txt",
            licenceOutput: "RobotoMono-OFL.txt",
            jobs: [{ output: "roboto-mono.woff2", source: "ofl/robotomono/RobotoMono[wght].ttf", text: LATIN, weights: { min: 500, max: 700 } }],
        },
        {
            licence: "ofl/caveat/OFL.txt",
            licenceOutput: "Caveat-OFL.txt",
            // Paper writes only digits by hand, and stamps SOLVED (game.complete.stamp in English) on the
            // completion card; any other text falls through to WenKai
            jobs: [{ output: "caveat.woff2", source: "ofl/caveat/Caveat[wght].ttf", text: "0123456789SOLVED", weights: { min: 500, max: 700 } }],
        },
        {
            licence: "ofl/lxgwwenkaitc/OFL.txt",
            licenceOutput: "LXGWWenKaiTC-OFL.txt",
            jobs: [
                { output: "lxgw-wenkai-tc-regular.woff2", source: "ofl/lxgwwenkaitc/LXGWWenKaiTC-Regular.ttf", text: chineseText },
                { output: "lxgw-wenkai-tc-bold.woff2", source: "ofl/lxgwwenkaitc/LXGWWenKaiTC-Bold.ttf", text: chineseText },
            ],
        },
        {
            licence: "ofl/pressstart2p/OFL.txt",
            licenceOutput: "PressStart2P-OFL.txt",
            // 8-bit style's digits: board, keys, timer and counts; the timer's colon too, so it does not
            // fall back to Cubic 11 between two pixel digits
            jobs: [{ output: "press-start-2p.woff2", source: "ofl/pressstart2p/PressStart2P-Regular.ttf", text: "0123456789:" }],
        },
        {
            licence: "ofl/silkscreen/OFL.txt",
            licenceOutput: "Silkscreen-OFL.txt",
            // 8-bit style's pencil marks are digits only
            jobs: [{ output: "silkscreen.woff2", source: "ofl/silkscreen/Silkscreen-Regular.ttf", text: "0123456789" }],
        },
        {
            licence: "OFL.txt",
            licenceOutput: "Cubic11-OFL.txt",
            fetch: downloadCubic,
            // 8-bit style's text in both languages, cut to the characters the app writes like WenKai
            jobs: [{ output: "cubic-11.woff2", source: "fonts/ttf/Cubic_11.ttf", text: chineseText }],
        },
        {
            licence: "ofl/orbitron/OFL.txt",
            licenceOutput: "Orbitron-OFL.txt",
            // Cyberpunk's digits and buttons: the variable face cut to the weights the skin uses
            jobs: [{ output: "orbitron.woff2", source: "ofl/orbitron/Orbitron[wght].ttf", text: LATIN, weights: { min: 500, max: 900 } }],
        },
        {
            licence: "ofl/sharetechmono/OFL.txt",
            licenceOutput: "ShareTechMono-OFL.txt",
            // Cyberpunk's notes, timer and labels: printable ASCII only
            jobs: [{ output: "share-tech-mono.woff2", source: "ofl/sharetechmono/ShareTechMono-Regular.ttf", text: ASCII }],
        },
    ];

    mkdirSync(OUTPUT_DIR, { recursive: true });
    mkdirSync(LICENCE_DIR, { recursive: true });
    for (const family of families) {
        const fetchSource = family.fetch ?? download;
        writeFileSync(join(LICENCE_DIR, family.licenceOutput), await fetchSource(family.licence));
        for (const job of family.jobs) {
            const subset = await subsetFont(await fetchSource(job.source), job.text, {
                targetFormat: "woff2",
                preserveNameIds: LICENCE_NAME_IDS,
                ...(job.weights ? { variationAxes: { wght: job.weights } } : {}),
            });
            writeFileSync(join(OUTPUT_DIR, job.output), subset);
            console.log(`${job.output}: ${(subset.length / 1024).toFixed(1)} KB`);
        }
    }
    // The characters the WenKai subset was cut to; bundledFonts.test.ts checks the copy against it
    writeFileSync(join(OUTPUT_DIR, "lxgw-wenkai-tc-characters.txt"), chineseText);
    // Cubic 11 is cut to the same characters
    writeFileSync(join(OUTPUT_DIR, "cubic-11-characters.txt"), chineseText);
    console.log(`WenKai and Cubic 11 cover ${Array.from(chineseText).length} characters`);
};

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
