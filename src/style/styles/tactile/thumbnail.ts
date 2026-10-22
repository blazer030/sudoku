import type { ThumbnailLook } from "@/style/styles/thumbnailLook";

export const TACTILE_THUMBNAIL: ThumbnailLook = {
    sansFont: "var(--font-default)",
    page: "",
    board: "bg-background shadow-[inset_0_1px_2px_color-mix(in_srgb,var(--color-shadow)_22%,transparent)]",
    cell: "shadow-[inset_0_-1px_0_color-mix(in_srgb,var(--color-shadow)_16%,transparent)]",
    selected: "ring-1 ring-inset ring-primary",
    given: "font-sans",
    entered: "font-sans font-medium",
    circledSelection: false,
    key: "shadow-[0_2px_0_color-mix(in_srgb,var(--color-shadow)_28%,var(--color-background))]",
    keyDigit: "font-sans font-semibold",
    pill: "shadow-[0_2px_0_color-mix(in_srgb,var(--color-shadow)_28%,var(--color-background))]",
};
