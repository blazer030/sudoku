import { isBlankTap } from "@/presentation/composables/isBlankTap";

const DOUBLE_TAP_MAX_GAP_MS = 300;
const DOUBLE_TAP_MAX_DISTANCE_PX = 24;

/** Told every tap on the screen, it answers whether a tap on the blank completes a double tap. */
export const useBlankDoubleTap = () => {
    let firstTap: { time: number; x: number; y: number } | null = null;

    const isDoubleTap = (event: MouseEvent): boolean => {
        if (!isBlankTap(event.target)) {
            firstTap = null;
            return false;
        }
        const tap = { time: Date.now(), x: event.clientX, y: event.clientY };
        const completes = firstTap !== null
            && tap.time - firstTap.time <= DOUBLE_TAP_MAX_GAP_MS
            && Math.hypot(tap.x - firstTap.x, tap.y - firstTap.y) <= DOUBLE_TAP_MAX_DISTANCE_PX;
        // A completed double tap starts over, so a third quick tap is not a second one
        firstTap = completes ? null : tap;
        return completes;
    };

    return { isDoubleTap };
};
