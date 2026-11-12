import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import type { CompletedGroup } from "@/domain/game/Sudoku";
import type { GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import { groupPlacement } from "@/presentation/components/style-moments/groupPlacement";
import GroupOverlay from "@/presentation/components/style-moments/GroupOverlay.vue";
import { useSettingsStore } from "@/stores/settingsStore";
import type { StyleId } from "@/theme/themeIds";

/** A group effect over these groups, entered at the board's centre unless another origin is given. */
export const effectOf = (groups: CompletedGroup[], id = 1, origin = { row: 4, column: 4 }): GroupEffect => ({ id, groups, origin });

/** A length in the style, as a percentage of the board (NaN without one). */
const percentOf = (style: string | undefined, property: string): number =>
    Number.parseFloat(new RegExp(`(?:^|;)\\s*${property}:\\s*(-?[\\d.]+)%`).exec(style ?? "")?.[1] ?? "NaN");

/** Anything with attributes: a found element, or one got with get(). */
interface Styled {
    attributes: (key: string) => string | undefined;
}

/** Checks that the piece lies over the group, as groupPlacement places it, to three decimals of a percent. */
export const expectPlacedOver = (piece: Styled, group: CompletedGroup): void => {
    for (const [property, value] of Object.entries(groupPlacement(group))) {
        expect(percentOf(piece.attributes("style"), property), property).toBeCloseTo(Number.parseFloat(value), 3);
    }
};

/** Mounts GroupOverlay with the style chosen, so it draws that style's overlay. */
export const mountInGroupOverlay = (style: StyleId, effect: GroupEffect) => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useSettingsStore().setStyle(style);
    return mount(GroupOverlay, { props: { effect }, global: { plugins: [pinia] } });
};
