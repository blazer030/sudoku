import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

// Colours live in src/theme/ and the generated CSS; everything else uses tokens
const HARDCODED_COLOR_PATTERNS: readonly RegExp[] = [
    /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g,
    /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/g,
    /\b(?:bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|outline|divide|decoration|shadow|fill|stroke|from|via|to|caret|placeholder|accent)-(?:white|black)\b/g,
    /\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|divide|decoration|shadow|accent|caret|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
    // Named colours as attribute or script values: fill="white", color: "black"
    /[:=]\s*["'](?:white|black)["']/g,
];

// Named colours inside CSS (stylesheets and <style> blocks), where prose cannot appear
const CSS_NAMED_COLOR_PATTERN = /(?:[:(,]\s*|\s)(?:white|black)(?=[\s;),!]|$)/g;

const findHardcodedColors = (line: string, isCss = false): string[] =>
    [...HARDCODED_COLOR_PATTERNS, ...(isCss ? [CSS_NAMED_COLOR_PATTERN] : [])]
        .flatMap(pattern => [...line.matchAll(pattern)].map(match => match[0].trim()));

const collectFiles = (directory: string, extensions: readonly string[]): string[] =>
    readdirSync(directory).flatMap((name) => {
        const path = join(directory, name);
        if (statSync(path).isDirectory()) return collectFiles(path, extensions);
        return extensions.some(extension => name.endsWith(extension)) ? [path] : [];
    });

const scanFile = (path: string): string[] => {
    let inStyleBlock = path.endsWith(".css");
    let inExemptData = false;
    return readFileSync(path, "utf8").split("\n").flatMap((line, lineIndex) => {
        if (/<style\b/.test(line)) inStyleBlock = true;
        if (line.includes("</style>")) inStyleBlock = path.endsWith(".css");
        // index.html's inline script carries palette data; noFlashScript.test.ts checks it against src/theme
        if (line.includes("BEGIN theme-color data")) inExemptData = true;
        if (line.includes("END theme-color data")) inExemptData = false;
        if (inExemptData) return [];
        return findHardcodedColors(line, inStyleBlock).map(match => `${path}:${lineIndex + 1}: ${match}`);
    });
};

describe("hard-coded colours", () => {
    it("should detect hex, white text and palette classes", () => {
        expect(findHardcodedColors('class="bg-gray-100 text-white" style="color: #fff"')).toHaveLength(3);
    });

    it("should detect named colours, white or black utilities and modern colour functions", () => {
        expect(findHardcodedColors('<path fill="white" class="border-black ring-white" />')).toHaveLength(3);
        expect(findHardcodedColors("color: oklch(0.5 0.1 200);")).toHaveLength(1);
        expect(findHardcodedColors("mask-image: linear-gradient(black, transparent);", true)).toHaveLength(1);
        expect(findHardcodedColors("Icons no longer sit on a white circle")).toHaveLength(0);
    });

    it("should not appear in src/presentation, src/style or index.html", () => {
        const files = [
            ...collectFiles("src/presentation", [".vue", ".ts"]),
            ...collectFiles("src/style", [".css"]).filter(path => !path.endsWith("themes.generated.css")),
            "index.html",
        ];

        expect(files.flatMap(scanFile)).toEqual([]);
    });
});
