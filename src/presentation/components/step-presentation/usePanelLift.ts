import { computed, nextTick, ref, watch, type Ref, type WatchSource } from "vue";
import { useRoomBelow } from "@/presentation/composables/useRoomBelow";
import { panelLift } from "@/presentation/components/step-presentation/panelLift";

export interface PanelLiftOptions {
    // The area the panel opens over: the room it has is measured from its top down to the screen's bottom
    inputArea: Ref<HTMLElement | null>;
    // How many pixels short of the screen's bottom edge the panel stops
    bottomGap: number;
    // Whether the panel is open; the room is measured again each time it opens
    open: WatchSource<boolean>;
    // The height the panel must keep on screen, or null while it is not there
    panelHeight: () => number | null;
    // What changes the panel's height, so it is measured again once it shows the change
    remeasureOn: WatchSource<unknown>[];
}

/**
 * A panel that opens over the controls (the hint panel, the Walkthrough's overlays) and rises over the
 * board on a short screen so what it must show stays on screen: the room below the controls, how far the
 * panel rises, and the height it may then take.
 */
export const usePanelLift = ({ inputArea, bottomGap, open, panelHeight, remeasureOn }: PanelLiftOptions) => {
    const { room, measure: measureRoom } = useRoomBelow(inputArea, bottomGap);
    watch(open, (isOpen) => {
        if (isOpen) measureRoom();
    });

    const lift = ref(0);
    const maxHeight = computed(() => room.value === null ? null : room.value + lift.value);

    const measureLift = () => {
        const height = panelHeight();
        lift.value = height === null || room.value === null ? 0 : panelLift(room.value, height);
    };
    watch([...remeasureOn, room], () => { void nextTick(measureLift); }, { immediate: true });

    return { room, lift, maxHeight };
};
