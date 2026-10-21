import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

// Colours live in src/theme/ and the generated CSS; everything else uses tokens
const HARDCODED_COLOR_PATTERNS: readonly RegExp[] = [
    /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g,
    /\b(?:rgba?|hsla?)\(/g,
    /\b(?:bg|text)-(?:white|black)\b/g,
    /\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|divide|decoration|shadow|accent|caret|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
];

const findHardcodedColors = (line: string): string[] =>
    HARDCODED_COLOR_PATTERNS.flatMap(pattern => [...line.matchAll(pattern)].map(match => match[0]));

const collectFiles = (directory: string, extensions: readonly string[]): string[] =>
    readdirSync(directory).flatMap((name) => {
        const path = join(directory, name);
        if (statSync(path).isDirectory()) return collectFiles(path, extensions);
        return extensions.some(extension => name.endsWith(extension)) ? [path] : [];
    });

describe("hard-coded colours", () => {
    it("should detect hex, white text and palette classes", () => {
        expect(findHardcodedColors('class="bg-gray-100 text-white" style="color: #fff"')).toHaveLength(3);
    });

    it("should not appear in src/presentation or src/style", () => {
        const files = [
            ...collectFiles("src/presentation", [".vue", ".ts"]),
            ...collectFiles("src/style", [".css"]).filter(path => !path.endsWith("themes.generated.css")),
        ];
        const offenders = files.flatMap(path =>
            readFileSync(path, "utf8").split("\n").flatMap((line, lineIndex) =>
                findHardcodedColors(line).map(match => `${path}:${lineIndex + 1}: ${match}`)));

        expect(offenders).toEqual([]);
    });
});
