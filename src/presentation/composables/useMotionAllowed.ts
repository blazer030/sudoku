import { prefersReducedMotion } from "@/presentation/composables/prefersReducedMotion";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * The one rule for every animation effect in play (a digit arriving or leaving, a group flash, a hint
 * reveal, fireworks, a style's celebration): the player's 動態效果 switch is on and the system
 * does not ask for reduced motion. A function rather than a computed, so a change in the system
 * preference is seen the next time it is asked. Loading animations and ambient decoration are not
 * covered; they follow only the system's reduced motion.
 */
export const useMotionAllowed = (): (() => boolean) => {
    const settingsStore = useSettingsStore();
    return () => settingsStore.motionEffects && !prefersReducedMotion();
};
