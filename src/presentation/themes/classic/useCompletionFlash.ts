import { ref } from "vue";

const FLASH_DURATION = 500;
const RIPPLE_DELAY = 60;

export const useCompletionFlash = () => {
    const flashingCells = ref(new Set<string>());

    const triggerFlash = (
        cells: { row: number; column: number }[],
        origin: { row: number; column: number },
    ) => {
        if (cells.length === 0) return;

        for (const cell of cells) {
            const key = `${cell.row},${cell.column}`;
            const distance = Math.abs(cell.row - origin.row) + Math.abs(cell.column - origin.column);
            const delay = distance * RIPPLE_DELAY;

            setTimeout(() => {
                flashingCells.value = new Set([...flashingCells.value, key]);
                setTimeout(() => {
                    const next = new Set(flashingCells.value);
                    next.delete(key);
                    flashingCells.value = next;
                }, FLASH_DURATION);
            }, delay);
        }
    };

    const isFlashing = (row: number, column: number): boolean => {
        return flashingCells.value.has(`${row},${column}`);
    };

    return { triggerFlash, isFlashing };
};
