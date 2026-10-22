import { expect } from "vitest";
import type { VueWrapper } from "@vue/test-utils";

// Five 56px keys and four 8px gaps make a 312px row. A letterboxed window can leave less than
// that, so each row shares out its width in five columns that never grow past 3.5rem (56px)
// but may shrink, and every key fills its column as a square. jsdom has no layout, so the
// classes stand in for the measurement.
export const KEY_ROW_COLUMNS = "grid-cols-[repeat(5,minmax(0,3.5rem))]";

const KEY_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => `number-${digit}`).concat("erase-button");

export const expectKeyRowsToShrinkToFit = (wrapper: VueWrapper): void => {
    const rows = wrapper.findAll("[data-testid='digit-key-row']");

    expect(rows).toHaveLength(2);
    for (const row of rows) {
        expect(row.classes()).toEqual(expect.arrayContaining(["grid", KEY_ROW_COLUMNS, "justify-center"]));
    }
    for (const keyId of KEY_IDS) {
        const key = wrapper.get(`[data-testid='${keyId}']`);
        expect(key.classes(), keyId).toEqual(expect.arrayContaining(["w-full", "aspect-square"]));
        expect(key.classes(), keyId).not.toContain("w-14");
        expect(key.classes(), keyId).not.toContain("h-14");
    }
};
