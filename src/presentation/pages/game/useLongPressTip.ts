import { watch, type Ref } from "vue";
import { useSettingsStore } from "@/stores/settingsStore";

interface LongPressTipOptions {
    selectedDigit: Ref<number | null>;
    showTip: () => void;
}

/** Explains the long press once, the first time the player picks a digit, and remembers it across games. */
export const useLongPressTip = ({ selectedDigit, showTip }: LongPressTipOptions) => {
    const settingsStore = useSettingsStore();

    watch(selectedDigit, (digit) => {
        if (digit === null || settingsStore.seenLongPressTip) return;
        showTip();
        settingsStore.markLongPressTipSeen();
    });
};
