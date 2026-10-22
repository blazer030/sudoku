import { computed, onScopeDispose, ref, type ComputedRef, type Ref } from "vue";
import { DARK_SCHEME_QUERY, listenForChanges, resolveColorMode } from "@/presentation/theme/appearanceSync";
import type { Appearance, ColorMode } from "@/application/SettingsStorage";

/** Whether the system asks for dark, kept live until stop. Old WebViews and jsdom may lack matchMedia; they count as light. */
export const watchSystemDark = (): { systemPrefersDark: Ref<boolean>; stop: () => void } => {
    const darkScheme = typeof window.matchMedia === "function" ? window.matchMedia(DARK_SCHEME_QUERY) : null;
    const systemPrefersDark = ref(darkScheme?.matches ?? false);
    const stop = darkScheme === null
        ? () => undefined
        : listenForChanges(darkScheme, () => { systemPrefersDark.value = darkScheme.matches; });
    return { systemPrefersDark, stop };
};

/** The light or dark the app is showing right now, following the system while the appearance is "system". */
export const useColorMode = (appearance: Ref<Appearance>): ComputedRef<ColorMode> => {
    const { systemPrefersDark, stop } = watchSystemDark();
    onScopeDispose(stop);
    return computed(() => resolveColorMode(appearance.value, systemPrefersDark.value));
};
