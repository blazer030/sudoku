import { pixelIcons } from "@/style/styles/pixel/icons";

describe("pixel icons", () => {
    it.each([
        [11, 16], [12, 16], [13, 16], [14, 16], [16, 16], [18, 16],
        [20, 24], [22, 24], [24, 24],
        [32, 32],
        [36, 40], [40, 40],
    ])("should show size %i at %i, a whole multiple of its grid", (size, shown) => {
        expect(pixelIcons.snapSize?.(size)).toBe(shown);
    });

    it.each([1, 19, 25, 100])("should keep size %i on the grid too", (size) => {
        const shown = pixelIcons.snapSize?.(size) ?? 0;

        expect(shown % 8).toBe(0);
        expect(shown).toBeGreaterThanOrEqual(16);
    });
});
