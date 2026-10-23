import { getPalette } from "@/theme/palettes";
import { STYLE_IDS, THEME_IDS_BY_STYLE, type StyleId } from "@/theme/themeIds";
import { styleIconBackground, styleIconForeground, styleIconMonochrome, styleIconSvg } from "@/theme/styleIcons";

const minimalGreen = getPalette("minimal", "green", "light");
const tactileGreenDark = getPalette("tactile", "green", "dark");
const paperRedInk = getPalette("paper", "redInk", "light");
const firstPalette = (style: StyleId) => getPalette(style, THEME_IDS_BY_STYLE[style][0], "light");

// Every colour the markup paints with, fills and strokes alike
const paintsOf = (svg: string): string[] =>
    [...svg.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{6})"/g)].map(([, color]) => color);

const rectsOf = (svg: string): string[] => svg.match(/<rect [^>]*\/>/g) ?? [];

describe("styleIcons", () => {
    it("should keep minimal's 3×3 tiles in on-primary on the primary", () => {
        const svg = styleIconSvg("minimal", minimalGreen);
        const tiles = rectsOf(svg).filter(rect => rect.includes(`fill="${minimalGreen["on-primary"]}"`));

        expect(svg).toContain(`<rect width="108" height="108" fill="${minimalGreen.primary}"/>`);
        expect(tiles).toHaveLength(9);
        expect(tiles.filter(tile => tile.includes("fill-opacity"))).toHaveLength(5);
        expect(tiles[0]).toBe(`<rect x="21.6" y="21.6" width="18" height="18" rx="5.4" fill="${minimalGreen["on-primary"]}" fill-opacity="0.25"/>`);
    });

    it("should raise tactile's centre tile in the theme primary with its digit in on-primary", () => {
        const svg = styleIconSvg("tactile", tactileGreenDark);

        expect(svg).toContain(`<rect width="108" height="108" fill="${tactileGreenDark.background}"/>`);
        expect(svg).toContain(`<rect x="44" y="44" width="20" height="20" rx="5" fill="${tactileGreenDark.primary}"/>`);
        expect(svg).toContain(`stroke="${tactileGreenDark["on-primary"]}"`);
        expect(rectsOf(svg).filter(rect => rect.includes(`fill="${tactileGreenDark.card}"`))).toHaveLength(8);
    });

    it("should rule paper in its own colours with the grid in the ink and the circle in danger", () => {
        const svg = styleIconSvg("paper", paperRedInk);

        expect(svg).toContain(`<rect width="108" height="108" fill="${paperRedInk.background}"/>`);
        expect(svg).toMatch(new RegExp(`<g [^>]*stroke="${paperRedInk.rule}"`));
        expect(svg).toContain(`<path d="M24 0V108" stroke="${paperRedInk["margin-line"]}" stroke-width="1.6"/>`);
        expect(svg).toMatch(new RegExp(`<g fill="none" stroke="${paperRedInk.primary}"[^>]*><path d="M36 29 `));
        expect(svg).toMatch(new RegExp(`<path d="M63\\.5 50 [^"]*" fill="none" stroke="${paperRedInk.danger}"`));
    });

    it.each(STYLE_IDS)("should draw the %s icon as a plain 108 square with no text", (style) => {
        const svg = styleIconSvg(style, firstPalette(style));

        expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 108 108">/);
        expect(rectsOf(svg)[0]).toMatch(/^<rect width="108" height="108" fill="#[0-9A-F]{6}"\/>$/);
        expect(svg).not.toContain("<text");
    });

    it("should back each style's adaptive icon with the colour behind its artwork", () => {
        expect(styleIconBackground("minimal", minimalGreen)).toBe(minimalGreen.primary);
        expect(styleIconBackground("tactile", tactileGreenDark)).toBe(tactileGreenDark.background);
        expect(styleIconBackground("paper", paperRedInk)).toBe(paperRedInk.background);
    });

    it("should leave minimal's foreground to its tiles and give tactile and paper their whole artwork", () => {
        expect(styleIconForeground("minimal", minimalGreen)).not.toContain(minimalGreen.primary);
        expect(styleIconForeground("tactile", tactileGreenDark)).toContain(`fill="${tactileGreenDark.background}"`);
        expect(styleIconForeground("paper", paperRedInk)).toContain(`fill="${paperRedInk.background}"`);
    });

    it("should fit each foreground's artwork into the adaptive icon's 72dp viewport", () => {
        for (const style of STYLE_IDS) {
            const foreground = styleIconForeground(style, firstPalette(style));

            expect(foreground).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 108 108">/);
            expect(foreground).toContain(`<g transform="translate(18 18) scale(${72 / 108})">`);
        }
    });

    it.each(STYLE_IDS)("should draw the %s monochrome icon in a single colour", (style) => {
        const paints = paintsOf(styleIconMonochrome(style));

        expect(paints.length).toBeGreaterThan(0);
        expect(new Set(paints).size).toBe(1);
    });
});
