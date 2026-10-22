import { computed, onScopeDispose, ref, type ComputedRef, type Ref } from "vue";
import { DARK_SCHEME_QUERY, listenForChanges, resolveColorMode } from "@/presentation/theme/appearanceSync";
import type { Appearance, ColorMode } from "@/application/SettingsStorage";

/** The light or dark the app is showing right now, following the system while the appearance is "system". */
export const useColorMode = (appearance: Ref<Appearance>): ComputedRef<ColorMode> => {
    // Old WebViews and jsdom may lack matchMedia; treat them as a light system
    const darkScheme = typeof window.matchMedia === "function" ? window.matchMedia(DARK_SCHEME_QUERY) : null;
    const systemPrefersDark = ref(darkScheme?.matches ?? false);
    if (darkScheme !== null) {
        const stopListening = listenForChanges(darkScheme, () => { systemPrefersDark.value = darkScheme.matches; });
        onScopeDispose(stopListening);
    }
    return computed(() => resolveColorMode(appearance.value, systemPrefersDark.value));
};
