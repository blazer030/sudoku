import type { StyleId } from "@/theme/themeIds";

/**
 * How a style lays out the continue card. "chips": the title over a wrapping row of rounded chips.
 * "title-block": a drawing's title block, the title in its own row over three equal columns, each captioned
 * by its data-caption, lines between them.
 */
export type ContinueLayout = "chips" | "title-block";

// One entry per style, so a style added without its layout is a type error
export const CONTINUE_LAYOUTS: Record<StyleId, ContinueLayout> = {
    minimal: "chips",
    tactile: "chips",
    paper: "chips",
    pixel: "chips",
    cyber: "chips",
    ink: "chips",
    chalkboard: "chips",
    blueprint: "title-block",
    aurora: "chips",
};
