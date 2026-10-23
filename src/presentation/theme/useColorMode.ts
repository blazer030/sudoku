import { computed, type ComputedRef, type Ref } from "vue";
import type { ColorMode } from "@/theme/themeIds";

/** The light or dark the app is showing right now. */
export const useColorMode = (appearance: Ref<ColorMode>): ComputedRef<ColorMode> => computed(() => appearance.value);
