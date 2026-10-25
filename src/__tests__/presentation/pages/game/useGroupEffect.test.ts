import { afterEach, describe, expect, it, vi } from "vitest";
import { effectScope } from "vue";
import { GROUP_RIPPLE_STEP_MS, useGroupEffect } from "@/presentation/pages/game/useGroupEffect";
import type { CompletedGroup } from "@/domain/game/Sudoku";

const EFFECT_MS = 500;

const rowCells = (row: number) => Array.from({ length: 9 }, (_, column) => ({ row, column }));
const columnCells = (column: number) => Array.from({ length: 9 }, (_, row) => ({ row, column }));

const ROW_0: CompletedGroup[] = [{ kind: "row", index: 0 }];

afterEach(() => {
    vi.useRealTimers();
});

describe("useGroupEffect", () => {
    it("should mark every cell of the group with its kind at once, the ripple left to the cells' own delay", () => {
        vi.useFakeTimers();
        const { play, isInEffect } = useGroupEffect(() => true, () => EFFECT_MS);

        play(ROW_0, rowCells(0), { row: 0, column: 4 });

        expect(isInEffect(0, 0)).toEqual(["row"]);
        expect(isInEffect(0, 8)).toEqual(["row"]);
        expect(isInEffect(1, 0)).toEqual([]);
    });

    it("should give a cell every kind it completed, when a row and a column cross on it", () => {
        vi.useFakeTimers();
        const { play, isInEffect } = useGroupEffect(() => true, () => EFFECT_MS);

        const groups: CompletedGroup[] = [{ kind: "row", index: 0 }, { kind: "column", index: 8 }];
        play(groups, [...rowCells(0), ...columnCells(8)], { row: 0, column: 8 });

        expect(isInEffect(0, 8)).toEqual(["row", "column"]);
        expect(isInEffect(4, 8)).toEqual(["column"]);
    });

    it("should hold the groups and the origin on the effect", () => {
        vi.useFakeTimers();
        const { play, effect } = useGroupEffect(() => true, () => EFFECT_MS);

        play(ROW_0, rowCells(0), { row: 0, column: 4 });

        expect(effect.value?.groups).toEqual(ROW_0);
        expect(effect.value?.origin).toEqual({ row: 0, column: 4 });
        expect(typeof effect.value?.id).toBe("number");
    });

    it("should clear the effect once the farthest cell's effect has run", () => {
        vi.useFakeTimers();
        const { play, effect, isInEffect } = useGroupEffect(() => true, () => EFFECT_MS);

        // The farthest cell is 4 steps from the origin
        play(ROW_0, rowCells(0), { row: 0, column: 4 });
        const total = 4 * GROUP_RIPPLE_STEP_MS + EFFECT_MS;

        vi.advanceTimersByTime(total - 1);
        expect(effect.value).not.toBeNull();

        vi.advanceTimersByTime(1);
        expect(effect.value).toBeNull();
        expect(isInEffect(0, 0)).toEqual([]);
    });

    it("should take each style's effect length from the duration it is given", () => {
        vi.useFakeTimers();
        let duration = 300;
        const { play, effect } = useGroupEffect(() => true, () => duration);

        duration = 800;
        play(ROW_0, [{ row: 0, column: 0 }], { row: 0, column: 0 });

        vi.advanceTimersByTime(799);
        expect(effect.value).not.toBeNull();
        vi.advanceTimersByTime(1);
        expect(effect.value).toBeNull();
    });

    it("should set nothing when motion is not allowed", () => {
        vi.useFakeTimers();
        const { play, effect, isInEffect } = useGroupEffect(() => false, () => EFFECT_MS);

        play(ROW_0, rowCells(0), { row: 0, column: 0 });

        expect(effect.value).toBeNull();
        expect(isInEffect(0, 0)).toEqual([]);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("should set nothing when there are no cells", () => {
        const { play, effect } = useGroupEffect(() => true, () => EFFECT_MS);

        play([], [], { row: 0, column: 0 });

        expect(effect.value).toBeNull();
    });

    it("should replace a running effect with a new id, leaving no cell of the old one marked", () => {
        vi.useFakeTimers();
        const { play, effect, isInEffect } = useGroupEffect(() => true, () => EFFECT_MS);

        play(ROW_0, rowCells(0), { row: 0, column: 0 });
        const firstId = effect.value?.id;
        vi.advanceTimersByTime(200);

        play([{ kind: "column", index: 8 }], columnCells(8), { row: 0, column: 8 });

        expect(effect.value?.id).not.toBe(firstId);
        expect(isInEffect(0, 0)).toEqual([]);
        expect(isInEffect(0, 8)).toEqual(["column"]);

        // Both run 8 steps; the first effect's timer would have ended here, and the second still runs
        vi.advanceTimersByTime(8 * GROUP_RIPPLE_STEP_MS + EFFECT_MS - 200);
        expect(isInEffect(4, 8)).toEqual(["column"]);

        vi.advanceTimersByTime(200);
        expect(effect.value).toBeNull();
        expect(vi.getTimerCount()).toBe(0);
    });

    it("should stop a running effect at once, leaving no timer", () => {
        vi.useFakeTimers();
        const { play, stop, effect, isInEffect } = useGroupEffect(() => true, () => EFFECT_MS);
        play(ROW_0, rowCells(0), { row: 0, column: 4 });

        stop();

        expect(effect.value).toBeNull();
        expect(isInEffect(0, 0)).toEqual([]);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("should leave no timer behind when its scope ends", () => {
        vi.useFakeTimers();
        const scope = effectScope();
        scope.run(() => {
            const { play } = useGroupEffect(() => true, () => EFFECT_MS);
            play(ROW_0, rowCells(0), { row: 0, column: 0 });
        });

        scope.stop();

        expect(vi.getTimerCount()).toBe(0);
    });
});
