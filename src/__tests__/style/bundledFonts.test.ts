import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { dirname, join, resolve } from "path";
import postcss from "postcss";

const FONTS_CSS = "src/style/fonts.css";

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

    it("should ship each family's licence beside its files", () => {
        for (const licence of ["Outfit-OFL.txt", "RobotoMono-OFL.txt", "Caveat-OFL.txt", "LXGWWenKaiTC-OFL.txt"]) {
            expect(readFileSync(`src/assets/fonts/${licence}`, "utf8"), licence).toContain("SIL Open Font License");
        }
    });

    it("should cover every character the app writes in its WenKai subset (run npm run generate:fonts)", () => {
        const covered = new Set(readFileSync("src/assets/fonts/lxgw-wenkai-tc-characters.txt", "utf8"));
        const missing = [...sourceCharacters()].filter(character => !covered.has(character));

        expect(missing.join("")).toBe("");
    });

    it("should import the font faces into the app's stylesheet", () => {
        expect(readFileSync("src/style/index.css", "utf8")).toContain('@import "./fonts.css";');
    });
});
