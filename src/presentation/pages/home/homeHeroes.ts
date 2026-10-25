import type { StyleId } from "@/theme/themeIds";

/**
 * How a style sets Home's title. "stacked": the logo, the title and the subtitle centred one above
 * another. "vertical": the title set vertically at the right, the subtitle running down its left and a
 * seal under the title.
 */
export type HomeHeroLayout = "stacked" | "vertical";

// One entry per style, so a style added without its hero is a type error
export const STYLE_HOME_HEROES: Record<StyleId, HomeHeroLayout> = {
    minimal: "stacked",
    tactile: "stacked",
    paper: "stacked",
    pixel: "stacked",
    cyber: "stacked",
    ink: "vertical",
};
