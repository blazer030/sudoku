import type { StyleId } from "@/theme/themeIds";
import { syncAuroraFonts } from "@/style/styles/aurora/fonts";
import { syncBlueprintFonts } from "@/style/styles/blueprint/fonts";
import { syncChalkboardFonts } from "@/style/styles/chalkboard/fonts";
import { syncCyberFonts } from "@/style/styles/cyber/fonts";
import { syncInkFonts } from "@/style/styles/ink/fonts";
import { syncPaperFonts } from "@/style/styles/paper/fonts";
import { syncPixelFonts } from "@/style/styles/pixel/fonts";

/**
 * Each style's font gate (styles/<id>/fonts.ts), or null for a style drawn in the app's own faces. One entry per
 * style, so a style added without deciding its faces is a type error.
 */
export const STYLE_FONT_GATES: Readonly<Record<StyleId, ((active: boolean) => void) | null>> = {
    minimal: null,
    tactile: null,
    paper: syncPaperFonts,
    pixel: syncPixelFonts,
    cyber: syncCyberFonts,
    ink: syncInkFonts,
    chalkboard: syncChalkboardFonts,
    blueprint: syncBlueprintFonts,
    aurora: syncAuroraFonts,
};

/** Opens the current style's gate and closes every other's. */
export const syncStyleFonts = (current: StyleId): void => {
    for (const [style, gate] of Object.entries(STYLE_FONT_GATES)) gate?.(style === current);
};
