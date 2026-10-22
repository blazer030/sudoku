import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { dirname, join, resolve } from "path";
import postcss from "postcss";
import { mappedCodePoints, nameStrings } from "./woff2Tables";

const FONTS_CSS = "src/style/fonts.css";
const BUNDLED_FONTS = ["outfit.woff2", "roboto-mono.woff2", "caveat.woff2", "lxgw-wenkai-tc-regular.woff2", "lxgw-wenkai-tc-bold.woff2"];

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
        for (const path of ["index.html", "vite.config.ts", "src/presentation/theme/paperFonts.ts"]) {
            expect(readFileSync(path, "utf8"), path).not.toMatch(/fonts\.(?:googleapis|gstatic)\.com/);
        }
    });

    it.each([
        ["Outfit", "400 700"],
        ["Roboto Mono", "500 700"],
        ["Caveat", "500 700"],
        ["LXGW WenKai TC", "400"],
        ["LXGW WenKai TC", "700"],
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
        for (const licence of ["Outfit-OFL.txt", "RobotoMono-OFL.txt", "Caveat-OFL.txt", "LXGWWenKaiTC-OFL.txt"]) {
            expect(readFileSync(`public/fonts/licenses/${licence}`, "utf8"), licence).toContain("SIL Open Font License");
        }
    });

    it.each(BUNDLED_FONTS)("should keep the licence in %s's name table", (file) => {
        // Name IDs 13 and 14 carry the licence and its URL; the subsetter drops them unless asked
        const names = nameStrings(readFileSync(`src/assets/fonts/${file}`));

        expect(names.get(13), "licence description").toMatch(/Open Font License/i);
        expect(names.get(14), "licence URL").toMatch(/openfontlicense\.org|scripts\.sil\.org\/OFL/i);
    });

    it("should read a font's character map", () => {
        // Caveat was cut to digits: it maps 7 but neither a letter nor a Chinese character
        const mapped = mappedCodePoints(readFileSync("src/assets/fonts/caveat.woff2"), [0x37, 0x41, 0x6578]);

        expect([...mapped]).toEqual([0x37]);
    });

    it.each(["lxgw-wenkai-tc-regular.woff2", "lxgw-wenkai-tc-bold.woff2"])("%s maps every character the app writes (run npm run generate:fonts)", (file) => {
        // Read from the font's own character map; emoji are left to the system's emoji font
        const wanted = [...sourceCharacters()].filter(character => !/\p{Extended_Pictographic}/u.test(character));
        const mapped = mappedCodePoints(readFileSync(`src/assets/fonts/${file}`), wanted.map(character => character.codePointAt(0) ?? 0));
        const missing = wanted.filter(character => !mapped.has(character.codePointAt(0) ?? 0));

        expect(missing.join("")).toBe("");
    });

    it("should import the font faces into the app's stylesheet", () => {
        expect(readFileSync("src/style/index.css", "utf8")).toContain('@import "./fonts.css";');
    });
});
