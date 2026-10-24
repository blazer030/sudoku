import { getCurrentScope, onScopeDispose, ref } from "vue";
import { BOX_SIZE } from "@/domain/board/constants";
import type { CompletedGroup, GroupKind } from "@/domain/game/Sudoku";
import type { GroupEffect } from "@/presentation/components/style-moments/styleMoments";

/** How much later a cell's effect starts for each row and column between it and the origin. */
export const GROUP_RIPPLE_STEP_MS = 60;

interface CellPosition {
    row: number;
    column: number;
}

/**
 * The effect a completed row, column or box plays. The cells are marked all at once with the kinds
 * of group they belong to; each cell's own CSS delay (from its distance to the origin) makes the
 * ripple. `durationMs` is one cell's effect, so the whole effect ends once the farthest cell's has run.
 */
export const useGroupEffect = (motionAllowed: () => boolean, durationMs: () => number) => {
    const effect = ref<GroupEffect | null>(null);
    let cellKinds = new Map<string, GroupKind[]>();
    let nextId = 1;
    let endTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingComplete: (() => void) | undefined;

    const end = () => {
        if (endTimer !== null) clearTimeout(endTimer);
        endTimer = null;
        effect.value = null;
        cellKinds = new Map();
        const onComplete = pendingComplete;
        pendingComplete = undefined;
        onComplete?.();
    };

    const play = (groups: CompletedGroup[], cells: CellPosition[], origin: CellPosition, onComplete?: () => void) => {
        // A new effect replaces a running one; whatever waited on the old one is not left hanging
        if (effect.value !== null) end();
        if (!motionAllowed() || cells.length === 0) {
            onComplete?.();
            return;
        }

        const isIn = (group: CompletedGroup, cell: CellPosition): boolean => {
            if (group.kind === "row") return cell.row === group.index;
            if (group.kind === "column") return cell.column === group.index;
            return Math.floor(cell.row / BOX_SIZE) * BOX_SIZE + Math.floor(cell.column / BOX_SIZE) === group.index;
        };
        cellKinds = new Map(cells.map(cell =>
            [`${cell.row},${cell.column}`, groups.filter(group => isIn(group, cell)).map(group => group.kind)]));

        const farthest = Math.max(...cells.map(cell =>
            Math.abs(cell.row - origin.row) + Math.abs(cell.column - origin.column)));
        pendingComplete = onComplete;
        effect.value = { id: nextId++, groups, origin };
        endTimer = setTimeout(end, farthest * GROUP_RIPPLE_STEP_MS + durationMs());
    };

    // Reading `effect` makes callers re-render: every play and end replaces it, and the kinds with it
    const isInEffect = (row: number, column: number): GroupKind[] => {
        if (effect.value === null) return [];
        return cellKinds.get(`${row},${column}`) ?? [];
    };

    // Leaving the screen mid-effect leaves no timer to call back into it
    if (getCurrentScope()) {
        onScopeDispose(() => {
            if (endTimer !== null) clearTimeout(endTimer);
            endTimer = null;
            pendingComplete = undefined;
        });
    }

    return { play, effect, isInEffect };
};
