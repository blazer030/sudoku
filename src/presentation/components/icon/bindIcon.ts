import { h, type Component, type FunctionalComponent } from "vue";
import IconGlyph from "./IconGlyph.vue";
import type { IconName } from "@/style/iconSet";

/** An icon component named as lucide names it, so a call site only changes where it imports from. */
export const bindIcon = (name: IconName, lucide: Component): FunctionalComponent => {
    const icon: FunctionalComponent = (_props, { attrs }) => h(IconGlyph, { ...attrs, name, lucide });
    icon.displayName = name;
    return icon;
};
