import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { dirname, join, resolve } from "path";
import postcss from "postcss";
import { mappedCodePoints, nameStrings } from "./woff2Tables";
import { en } from "@/presentation/i18n/messages/en";

const FONTS_CSS = "src/style/fonts.css";
const BUNDLED_FONTS = ["outfit.woff2", "roboto-mono.woff2", "caveat.woff2", "lxgw-wenkai-tc-regular.woff2", "lxgw-wenkai-tc-bold.woff2", "press-start-2p.woff2", "silkscreen.woff2", "orbitron.woff2", "share-tech-mono.woff2"];
const CUBIC_11 = "cubic-11.woff2";

interface FontFace {
    family: string;
    weight: string;
    display: string;
    src: string;
}

const fontFaces = (): FontFace[] => {
    const faces: FontFace[] = [];
    postcss.parse(readFileSync(FONTS_CSS, "utf8")).walkAtRules("font-face", (atRule) => {
        const declarations = new Map<string, string>();
        atRule.walkDecls((declaration) => { declarations.set(declaration.prop, declaration.value.trim()); });
        faces.push({
            family: (declarations.get("font-family") ?? "").replace(/"/g, ""),
            weight: declarations.get("font-weight") ?? "",
            display: declarations.get("font-display") ?? "",
            src: declarations.get("src") ?? "",
        });
    });
    return faces;
};

// Every non-ASCII character in the app's own source, which is all the Chinese copy it can show
const sourceCharacters = (): Set<string> => {
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
    visit("src");
    return characters;
};

describe("bundled fonts", () => {
    it("should load no font from Google, so every style reads the same offline", () => {
        for (const path of ["index.html", "vite.config.ts", "src/style/styles/paper/fonts.ts"]) {
            expect(readFileSync(path, "utf8"), path).not.toMatch(/fonts\.(?:googleapis|gstatic)\.com/);
        }
    });

    it.each([
        ["Outfit", "400 700"],
        ["Roboto Mono", "500 700"],
        ["Caveat", "500 700"],
        ["LXGW WenKai TC", "400"],
        ["LXGW WenKai TC", "700"],
        ["Press Start 2P", "400"],
        ["Silkscreen", "400"],
        ["Cubic 11", "400"],
        ["Orbitron", "500 900"],
        ["Share Tech Mono", "400"],
    ])("should declare %s %s from a bundled woff2 with swap", (family, weight) => {
        const face = fontFaces().find(candidate => candidate.family === family && candidate.weight === weight);

        expect(face).toBeDefined();
        expect(face?.display).toBe("swap");
        const url = /^url\("([^"]+\.woff2)"\) format\("woff2"\)$/.exec(face?.src ?? "")?.[1] ?? "";
        expect(url).not.toBe("");
        expect(existsSync(resolve(dirname(FONTS_CSS), url)), url).toBe(true);
    });

    it("should ship each family's licence in the build", () => {
        // public/ is copied as is into dist/, which the web build serves and the Android app packs
        for (const licence of ["Outfit-OFL.txt", "RobotoMono-OFL.txt", "Caveat-OFL.txt", "LXGWWenKaiTC-OFL.txt", "PressStart2P-OFL.txt", "Silkscreen-OFL.txt", "Cubic11-OFL.txt", "Orbitron-OFL.txt", "ShareTechMono-OFL.txt"]) {
            expect(readFileSync(`public/fonts/licenses/${licence}`, "utf8"), licence).toContain("SIL Open Font License");
        }
    });

    it.each(BUNDLED_FONTS)("should keep the licence in %s's name table", (file) => {
        // Name IDs 13 and 14 carry the licence and its URL; the subsetter drops them unless asked
        const names = nameStrings(readFileSync(`src/assets/fonts/${file}`));

        expect(names.get(13), "licence description").toMatch(/Open Font License/i);
        expect(names.get(14), "licence URL").toMatch(/openfontlicense\.org|scripts\.sil\.org\/OFL/i);
    });

    it("should keep Cubic 11's copyright notice, as the source font has no licence name IDs", () => {
        // Name IDs 13 and 14 are absent upstream; its copyright and free-software grant live in ID 0
        const names = nameStrings(readFileSync(`src/assets/fonts/${CUBIC_11}`));

        expect(names.get(13)).toBeUndefined();
        expect(names.get(0), "copyright notice").toMatch(/Copyright.*Cubic 11 Project Authors/s);
    });

    it("should read a font's character map", () => {
        // Caveat was cut to digits and the stamp's word: it maps 7 but neither an A nor a Chinese character
        const mapped = mappedCodePoints(readFileSync("src/assets/fonts/caveat.woff2"), [0x37, 0x41, 0x6578]);

        expect([...mapped]).toEqual([0x37]);
    });

    it("should map paper's English stamp in Caveat (run npm run generate:fonts)", () => {
        const word = en.game.complete.stamp;
        const wanted = Array.from(word, character => character.codePointAt(0) ?? 0);
        const mapped = mappedCodePoints(readFileSync("src/assets/fonts/caveat.woff2"), wanted);

        expect(word).not.toBe("");
        expect(wanted.filter(codePoint => !mapped.has(codePoint))).toEqual([]);
    });

    it.each(["lxgw-wenkai-tc-regular.woff2", "lxgw-wenkai-tc-bold.woff2"])("%s maps every character the app writes (run npm run generate:fonts)", (file) => {
        // Read from the font's own character map; emoji are left to the system's emoji font
        const wanted = [...sourceCharacters()].filter(character => !/\p{Extended_Pictographic}/u.test(character));
        const mapped = mappedCodePoints(readFileSync(`src/assets/fonts/${file}`), wanted.map(character => character.codePointAt(0) ?? 0));
        const missing = wanted.filter(character => !mapped.has(character.codePointAt(0) ?? 0));

        expect(missing.join("")).toBe("");
    });

    // The loader's and the celebration's decoration, in English in both languages
    it("should map pixel's NOW LOADING and STAGE CLEAR in Press Start 2P (run npm run generate:fonts)", () => {
        const wanted = Array.from(new Set("NOW LOADING... STAGE CLEAR"), character => character.codePointAt(0) ?? 0);
        const mapped = mappedCodePoints(readFileSync("src/assets/fonts/press-start-2p.woff2"), wanted);

        expect(wanted.filter(codePoint => !mapped.has(codePoint)).map(codePoint => String.fromCodePoint(codePoint))).toEqual([]);
    });

    it("should map the digits in the pixel faces, and the timer's colon and the moments' letters in the digit face", () => {
        const codePoints = (text: string): number[] => Array.from(text, character => character.codePointAt(0) ?? 0);
        // Press Start 2P sets the timer, so its colon is cut in too; otherwise it falls back to Cubic 11. It
        // also sets the moments' English decoration, so of the probes it maps the A as well.
        const expected: Readonly<Record<string, string>> = { "press-start-2p.woff2": "0123456789:A", "silkscreen.woff2": "0123456789" };

        for (const [file, text] of Object.entries(expected)) {
            const mapped = mappedCodePoints(readFileSync(`src/assets/fonts/${file}`), [...codePoints("0123456789:"), 0x41, 0x6578]);

            expect([...mapped].sort(), file).toEqual(codePoints(text).sort());
        }
    });

    it("should map the digits in Orbitron and printable ASCII in Share Tech Mono", () => {
        const codePoints = (text: string): number[] => Array.from(text, character => character.codePointAt(0) ?? 0);
        const digits = codePoints("0123456789");
        const ascii = Array.from({ length: 0x7e - 0x20 + 1 }, (_, offset) => 0x20 + offset);

        const orbitron = mappedCodePoints(readFileSync("src/assets/fonts/orbitron.woff2"), digits);
        const shareTechMono = mappedCodePoints(readFileSync("src/assets/fonts/share-tech-mono.woff2"), ascii);

        expect([...orbitron].sort()).toEqual(digits.sort());
        expect([...shareTechMono].sort((first, second) => first - second)).toEqual(ascii);
    });

    it("cubic-11.woff2 maps every character the app writes (run npm run generate:fonts)", () => {
        const wanted = [...sourceCharacters()].filter(character => !/\p{Extended_Pictographic}/u.test(character));
        const mapped = mappedCodePoints(readFileSync("src/assets/fonts/cubic-11.woff2"), wanted.map(character => character.codePointAt(0) ?? 0));
        const missing = wanted.filter(character => !mapped.has(character.codePointAt(0) ?? 0));

        expect(missing.join("")).toBe("");
    });

    it("should import the font faces into the app's stylesheet", () => {
        expect(readFileSync("src/style/index.css", "utf8")).toContain('@import "./fonts.css";');
    });
});
