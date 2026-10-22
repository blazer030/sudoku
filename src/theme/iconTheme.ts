// Picks one of the six launcher icons for any style's theme. Relative imports only.
import { ICON_THEME_IDS, type ColorThemeId, type IconThemeId, type StyleId } from "../application/SettingsStorage";
import { getPalette } from "./palettes";

// The icons are drawn in the minimal style's light primaries (scripts/iconArtwork.ts)
const ICON_STYLE: StyleId = "minimal";

export const ICON_COLORS: Readonly<Record<IconThemeId, string>> = Object.fromEntries(
    ICON_THEME_IDS.map(id => [id, getPalette(ICON_STYLE, id, "light").primary]),
) as Record<IconThemeId, string>;

const toLinear = (channel: number): number => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

/** The (a, b) chroma plane of OKLab for a "#RRGGBB" colour; lightness is left out on purpose. */
const chromaOf = (color: string): [number, number] => {
    const [red, green, blue] = [1, 3, 5].map(offset => toLinear(Number.parseInt(color.slice(offset, offset + 2), 16)));
    const long = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
    const medium = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
    const short = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
    return [
        1.9779984951 * long - 2.4285922050 * medium + 0.4505937099 * short,
        0.0259040371 * long + 0.7827717662 * medium - 0.8086757660 * short,
    ];
};

/**
 * The icon whose colour is nearest in hue and chroma. Lightness is ignored because the
 * palettes darken their primaries for contrast, which would pull them toward the wrong hue.
 * A tie goes to the earlier icon.
 */
export const nearestIconTheme = (color: string): IconThemeId => {
    const [colorA, colorB] = chromaOf(color);
    let nearest: IconThemeId = ICON_THEME_IDS[0];
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const id of ICON_THEME_IDS) {
        const [iconA, iconB] = chromaOf(ICON_COLORS[id]);
        const distance = Math.hypot(colorA - iconA, colorB - iconB);
        if (distance < nearestDistance) {
            nearest = id;
            nearestDistance = distance;
        }
    }
    return nearest;
};

const isIconTheme = (id: ColorThemeId): id is IconThemeId => (ICON_THEME_IDS as readonly string[]).includes(id);

/** The launcher icon for a theme: minimal's themes are the icons; others take the nearest by their light primary. */
export const iconThemeFor = (style: StyleId, themeId: ColorThemeId): IconThemeId => {
    // Widened to string while minimal is the only style, when the comparison is always true
    const styleName: string = style;
    if (styleName === ICON_STYLE && isIconTheme(themeId)) return themeId;
    return nearestIconTheme(getPalette(style, themeId, "light").primary);
};
