import { contrastRatio } from "@/theme/contrast";
import { getPalette } from "@/theme/palettes";
import { COLOR_MODES, STYLE_IDS, THEME_IDS_BY_STYLE, type StyleId } from "@/theme/themeIds";
import { styleIconBackground, styleIconForeground, styleIconMonochrome, styleIconSvg } from "@/theme/styleIcons";

const minimalGreen = getPalette("minimal", "green", "light");
const tactileGreenDark = getPalette("tactile", "green", "dark");
const paperRedInk = getPalette("paper", "redInk", "light");
const pixelHandheld = getPalette("pixel", "classic", "light");
const pixelConsole = getPalette("pixel", "classic", "dark");
const firstPalette = (style: StyleId) => getPalette(style, THEME_IDS_BY_STYLE[style][0], "light");

// Every colour the markup paints with, fills and strokes alike
const paintsOf = (svg: string): string[] =>
    [...svg.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{6})"/g)].map(([, color]) => color);

const rectsOf = (svg: string): string[] => svg.match(/<rect [^>]*\/>/g) ?? [];

const fillOf = (svg: string, rect: string): string => {
    const color = new RegExp(`<rect ${rect} fill="(#[0-9A-F]{6})"`).exec(svg)?.[1];
    if (!color) throw new Error(`no <rect ${rect}> in the icon`);
    return color;
};
// The colours of the rects that cover a point of the artwork, in paint order
const paintsAt = (svg: string, x: number, y: number): string[] => rectsOf(svg).flatMap((rect) => {
    const number = (name: string, fallback: number) => Number(new RegExp(`\\b${name}="(-?[\\d.]+)"`).exec(rect)?.[1] ?? fallback);
    const left = number("x", 0);
    const top = number("y", 0);
    const covers = x >= left && x < left + number("width", 0) && y >= top && y < top + number("height", 0);
    return covers ? [/fill="(#[0-9A-F]{6})"/.exec(rect)?.[1] ?? ""] : [];
});

// Contrast against black rises with luminance, so it orders colours from dark to light
const lightness = (color: string): number => contrastRatio(color, "#000000");

const tactilePalettes = THEME_IDS_BY_STYLE.tactile.flatMap(themeId =>
    COLOR_MODES.map(mode => ({ name: `${themeId} ${mode}`, palette: getPalette("tactile", themeId, mode) })));

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
        expect(rectsOf(svg).filter(rect => rect.includes(`fill="${tactileGreenDark["cell-clue"]}"`))).toHaveLength(8);
    });

    it("should raise tactile's light tiles in the card colour", () => {
        const tactileGreen = getPalette("tactile", "green", "light");

        expect(fillOf(styleIconSvg("tactile", tactileGreen), `x="21" y="21" width="20" height="20" rx="5"`)).toBe(tactileGreen.card);
    });

    it.each(tactilePalettes)("should sink tactile's well below the tray and raise its tiles above the well in $name", ({ palette }) => {
        const svg = styleIconSvg("tactile", palette);
        const tray = fillOf(svg, `width="108" height="108"`);
        const well = fillOf(svg, `x="15" y="15" width="78" height="78" rx="12"`);
        const tile = fillOf(svg, `x="21" y="21" width="20" height="20" rx="5"`);

        expect(lightness(well)).toBeLessThan(lightness(tray));
        expect(lightness(tile)).toBeGreaterThan(lightness(well));
    });

    it("should rule paper in its own colours with the grid in the ink and the circle in danger", () => {
        const svg = styleIconSvg("paper", paperRedInk);

        expect(svg).toContain(`<rect width="108" height="108" fill="${paperRedInk.background}"/>`);
        expect(svg).toMatch(new RegExp(`<g [^>]*stroke="${paperRedInk.rule}"`));
        expect(svg).toContain(`<path d="M24 0V108" stroke="${paperRedInk["margin-line"]}" stroke-width="1.6"/>`);
        expect(svg).toMatch(new RegExp(`<g fill="none" stroke="${paperRedInk.primary}"[^>]*><path d="M36 29 `));
        expect(svg).toMatch(new RegExp(`<path d="M63\\.5 50 [^"]*" fill="none" stroke="${paperRedInk.danger}"`));
    });

    it("should draw pixel's handheld screen in the four greens on the lightest", () => {
        const svg = styleIconSvg("pixel", pixelHandheld);

        expect(svg).toContain(`<rect width="108" height="108" fill="#9BBC0F"/>`);
        expect(new Set(paintsOf(svg))).toEqual(new Set(["#9BBC0F", "#0F380F", "#306230", "#8BAC0F"]));
    });

    it("should draw pixel's console screen on black with red hearts, a gold 5 and a star field", () => {
        const svg = styleIconSvg("pixel", pixelConsole);

        expect(svg).toContain(`<rect width="108" height="108" fill="#000000"/>`);
        for (const color of ["#FCFCFC", "#6C6C6C", "#3CBCFC", "#F8B800", "#F83800", "#1E1E3C"]) {
            expect(paintsOf(svg), color).toContain(color);
        }
    });

    it("should draw pixel's artwork on a 2-unit pixel grid", () => {
        for (const rect of rectsOf(styleIconSvg("pixel", pixelConsole)).slice(1)) {
            expect(rect).toMatch(/^<rect x="\d*[02468]" y="\d*[02468]" width="\d*[02468]" height="2" fill="#[0-9A-F]{6}"\/>$/);
        }
    });

    it.each([pixelHandheld, pixelConsole])("should keep pixel's background-sample point clear of stars and drawing", (palette) => {
        // The icon assets sample the background 5% across, halfway down
        expect(paintsAt(styleIconSvg("pixel", palette), 5.4, 54)).toEqual([palette.background]);
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
        expect(styleIconBackground("pixel", pixelConsole)).toBe(pixelConsole.background);
    });

    it("should leave minimal's foreground to its tiles and give tactile and paper their whole artwork", () => {
        expect(styleIconForeground("minimal", minimalGreen)).not.toContain(minimalGreen.primary);
        // Their background fills the whole 108dp layer: -27..135 of the artwork
        expect(styleIconForeground("tactile", tactileGreenDark))
            .toContain(`<rect x="-27" y="-27" width="162" height="162" fill="${tactileGreenDark.background}"/>`);
        expect(styleIconForeground("paper", paperRedInk))
            .toContain(`<rect x="-27" y="-27" width="162" height="162" fill="${paperRedInk.background}"/>`);
        expect(styleIconForeground("pixel", pixelConsole))
            .toContain(`<rect x="-27" y="-27" width="162" height="162" fill="${pixelConsole.background}"/>`);
    });

    it("should fit each foreground's artwork into the adaptive icon's 72dp viewport", () => {
        for (const style of STYLE_IDS) {
            const foreground = styleIconForeground(style, firstPalette(style));

            expect(foreground).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 108 108">/);
            expect(foreground).toContain(`<g transform="translate(18 18) scale(${72 / 108})">`);
        }
    });

    it("should bleed paper's rules and margin line to the edges of its foreground layer only", () => {
        const foreground = styleIconForeground("paper", paperRedInk);
        const icon = styleIconSvg("paper", paperRedInk);

        // The 72dp viewport scales by 2/3, so the 108dp layer spans -27..135 of the artwork
        expect(foreground).toContain(`<path d="M24 -27V135" stroke="${paperRedInk["margin-line"]}" stroke-width="1.6"/>`);
        expect(foreground).toContain(`<path d="M-27 -26H135M-27 -14H135M-27 -2H135M-27 22H135`);
        expect(foreground).toContain(`M-27 94H135M-27 118H135M-27 130H135"/>`);
        expect(icon).toContain(`<path d="M0 22H108M0 34H108M0 46H108M0 58H108M0 70H108M0 82H108M0 94H108"/>`);
    });

    it.each(STYLE_IDS)("should draw the %s monochrome icon in a single colour", (style) => {
        const paints = paintsOf(styleIconMonochrome(style));

        expect(paints.length).toBeGreaterThan(0);
        expect(new Set(paints).size).toBe(1);
    });
});
