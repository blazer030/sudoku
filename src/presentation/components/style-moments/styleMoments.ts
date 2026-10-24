import { computed, type Component, type ComputedRef } from "vue";
import type { StyleId } from "@/theme/themeIds";
import { useSettingsStore } from "@/stores/settingsStore";
import MinimalLoader from "@/presentation/components/style-moments/minimal/MinimalLoader.vue";
import TactileLoader from "@/presentation/components/style-moments/tactile/TactileLoader.vue";
import PaperLoader from "@/presentation/components/style-moments/paper/PaperLoader.vue";
import PaperCelebration from "@/presentation/components/style-moments/paper/PaperCelebration.vue";
import PaperGroupOverlay from "@/presentation/components/style-moments/paper/PaperGroupOverlay.vue";
import PaperDigitWriter from "@/presentation/components/style-moments/paper/PaperDigitWriter.vue";
import PixelLoader from "@/presentation/components/style-moments/pixel/PixelLoader.vue";
import PixelCelebration from "@/presentation/components/style-moments/pixel/PixelCelebration.vue";
import PixelGroupOverlay from "@/presentation/components/style-moments/pixel/PixelGroupOverlay.vue";
import CyberLoader from "@/presentation/components/style-moments/cyber/CyberLoader.vue";
import CyberCelebration from "@/presentation/components/style-moments/cyber/CyberCelebration.vue";
import CyberGroupOverlay from "@/presentation/components/style-moments/cyber/CyberGroupOverlay.vue";
import type { CompletedGroup } from "@/domain/game/Sudoku";

/** A group effect on the board: a new one gets a new id, which starts its drawings afresh. */
export interface GroupEffect {
    id: number;
    groups: CompletedGroup[];
    origin: { row: number; column: number };
}

export interface StyleMoments {
    loader: Component;
    /**
     * Decoration drawn over the completion scene, given `{ still }`; null when the board's and the card's
     * skin carry it all. The card itself carries `data-still` when motion is not allowed.
     */
    celebration: Component | null;
    /**
     * Decoration drawn on the completion card itself, so it moves with the card, given `{ still }`; none when
     * the card's skin carries it all.
     */
    cardDecoration?: Component | null;
    /**
     * How long one cell's group effect runs, in milliseconds. Each cell starts a ripple step later
     * for each row and column it lies from the origin; the effect ends when the farthest cell's has run.
     */
    groupEffectMs: number;
    /** Pieces drawn over the board for a group effect, given `{ effect }`; none when the cells carry it all. */
    groupOverlay?: Component | null;
    /** How long the board phase of the celebration runs before the dialog opens, in milliseconds. */
    celebrationBoardMs: number;
    /**
     * Writes an entered digit in while it arrives (only when motion is allowed), given `{ digit, maskId }`:
     * it renders an SVG `<mask>` with that id, which the arriving digit carries as `--digit-writer-mask` for
     * the skin to mask it by, and emits `written` once the digit shows whole, which settles the arrival.
     * None when the skin's `.value-arrive` carries it all.
     */
    digitWriter?: Component | null;
}

// From the boards: each cell's wash waits 100ms and runs 520ms; the dialog opens as the board's scrim
// comes in, while the diagonal wash is still crossing the board
const MINIMAL_MOMENTS: StyleMoments = {
    loader: MinimalLoader,
    celebration: null,
    groupEffectMs: 620,
    celebrationBoardMs: 640,
};

// From the boards: each piece's press waits 100ms and runs 440ms; the card drops in once the boxes have
// sprung up from the top left, while the last ones are still settling
const TACTILE_MOMENTS: StyleMoments = {
    loader: TactileLoader,
    celebration: null,
    groupEffectMs: 540,
    celebrationBoardMs: 760,
};

// From the boards: each cell's wash waits 100ms and runs 600ms, but the pencil runs longer: the box's loop
// starts 180ms in and takes 860ms, which a box entered at its centre (two steps out) just covers. The
// red-pen check is on the board by 680ms; the card lands as the scrim comes in. An entered digit is written
// in stroke by stroke, in 420–560ms.
const PAPER_MOMENTS: StyleMoments = {
    loader: PaperLoader,
    celebration: null,
    cardDecoration: PaperCelebration,
    groupEffectMs: 920,
    groupOverlay: PaperGroupOverlay,
    celebrationBoardMs: 760,
    digitWriter: PaperDigitWriter,
};

// From the boards: each cell waits 100ms and blinks twice in 360ms, and the sparks pop as the group's
// farthest cell blinks, so they end with it. The rows clear from the top 80ms apart; the dialog opens as
// the board's scrim comes in, while the last rows are still clearing.
const PIXEL_MOMENTS: StyleMoments = {
    loader: PixelLoader,
    celebration: PixelCelebration,
    groupEffectMs: 460,
    groupOverlay: PixelGroupOverlay,
    celebrationBoardMs: 800,
};

// From the boards: each cell's light waits 100ms and runs 480ms, but a box's outline steps out over 760ms
// from 100ms and its tag shows for 760ms from 220ms, which a box entered at its centre (two steps out)
// just covers. The scan beam crosses the board in 760ms and the brackets lock on; the dialog opens as the
// board's scrim comes in.
const CYBER_MOMENTS: StyleMoments = {
    loader: CyberLoader,
    celebration: CyberCelebration,
    groupEffectMs: 860,
    groupOverlay: CyberGroupOverlay,
    celebrationBoardMs: 860,
};

// One entry per style, so a style added without its moments is a type error
export const STYLE_MOMENTS: Record<StyleId, StyleMoments> = {
    minimal: MINIMAL_MOMENTS,
    tactile: TACTILE_MOMENTS,
    paper: PAPER_MOMENTS,
    pixel: PIXEL_MOMENTS,
    cyber: CYBER_MOMENTS,
};

export const useStyleMoments = (): ComputedRef<StyleMoments> => {
    const settings = useSettingsStore();
    return computed(() => STYLE_MOMENTS[settings.style]);
};
