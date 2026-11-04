import { shallowReadonly, shallowRef, type ShallowRef } from "vue";
import type { IconSet } from "@/style/iconSet";
import type { StyleId } from "@/theme/themeIds";

export type IconSetLoader = () => Promise<IconSet>;

/** Each style's own icons, a chunk of their own as only one style shows at a time. null draws lucide's. */
export const STYLE_ICON_SETS: Record<StyleId, IconSetLoader | null> = {
    minimal: null,
    tactile: () => import("@/style/styles/tactile/icons").then(module => module.tactileIcons),
    paper: () => import("@/style/styles/paper/icons").then(module => module.paperIcons),
    pixel: () => import("@/style/styles/pixel/icons").then(module => module.pixelIcons),
    cyber: () => import("@/style/styles/cyber/icons").then(module => module.cyberIcons),
    ink: null,
    chalkboard: null,
    blueprint: null,
    aurora: null,
};

// Kept here rather than read from the settings store, so an icon needs no store to mount
const currentSet = shallowRef<IconSet | null>(null);
let latestSelection = 0;

/** The set icons draw from; null draws lucide's. */
export const activeIconSet: Readonly<ShallowRef<IconSet | null>> = shallowReadonly(currentSet);

/**
 * Moves the icons to a style's set once it has loaded, keeping the current ones until then. Never rejects:
 * a set that can't load (a stale chunk on the web) leaves lucide's, and the app must still start.
 */
export const selectIconStyle = async (
    style: StyleId,
    loaders: Readonly<Record<StyleId, IconSetLoader | null>> = STYLE_ICON_SETS,
): Promise<void> => {
    latestSelection += 1;
    const selection = latestSelection;
    const loader = loaders[style];
    let nextSet: IconSet | null = null;
    if (loader !== null) {
        try {
            nextSet = await loader();
        } catch {
            nextSet = null;
        }
    }
    // A style chosen meanwhile wins, whichever finishes loading first
    if (selection === latestSelection) currentSet.value = nextSet;
};
