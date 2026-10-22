import type { ThumbnailLook } from "@/style/styles/thumbnailLook";

export const PAPER_THUMBNAIL: ThumbnailLook = {
    sansFont: "var(--font-wenkai)",
    page: "bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_7px,var(--color-rule)_7px,var(--color-rule)_8px)]",
    board: "bg-border",
    cell: "",
    selected: "",
    given: "font-print",
    entered: "font-hand font-bold text-[10px]",
    circledSelection: true,
    key: "",
    keyDigit: "font-hand font-bold text-[10px]",
    pill: "-rotate-2",
};
