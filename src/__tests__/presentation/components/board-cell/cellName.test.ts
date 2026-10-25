import { describe, expect, it } from "vitest";
import { cellName } from "@/presentation/components/board-cell/cellName";

describe("cellName", () => {
    it.each([
        [0, 0, "R1C1"],
        [8, 8, "R9C9"],
        [4, 4, "R5C5"],
        [3, 6, "R4C7"],
    ])("should name cell (%i, %i) %s", (row, column, name) => {
        expect(cellName(row, column)).toBe(name);
    });
});
