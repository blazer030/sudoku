import { ref } from "vue";

const FLASH_DURATION = 500;
const RIPPLE_DELAY = 60;

export const useCompletionFlash = (enabled: () => boolean = () => true) => {
    const flashingCells = ref(new Set<string>());

    const triggerFlash = (
        cells: { row: number; column: number }[],
        origin: { row: number; column: number },
        onComplete?: () => void,
    ) => {
        if (!enabled() || cells.length === 0) {
            onComplete?.();
            return;
        }

        let maxDelay = 0;
        for (const cell of cells) {
            const key = `${cell.row},${cell.column}`;
            const distance = Math.abs(cell.row - origin.row) + Math.abs(cell.column - origin.column);
            const delay = distance * RIPPLE_DELAY;
            if (delay > maxDelay) maxDelay = delay;

            setTimeout(() => {
                flashingCells.value = new Set([...flashingCells.value, key]);
                setTimeout(() => {
                    const next = new Set(flashingCells.value);
                    next.delete(key);
                    flashingCells.value = next;
                }, FLASH_DURATION);
            }, delay);
        }

        if (onComplete) {
            setTimeout(onComplete, maxDelay + FLASH_DURATION);
        }
    };

    const isFlashing = (row: number, column: number): boolean => {
        return flashingCells.value.has(`${row},${column}`);
    };

    return { triggerFlash, isFlashing };
};
