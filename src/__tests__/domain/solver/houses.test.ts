import { HOUSES, boxStart, combinationsOf } from "@/domain/solver/houses";

describe("houses", () => {
    it("should list the 27 houses, rows then columns then boxes, each with nine cells in reading order", () => {
        expect(HOUSES).toHaveLength(27);
        expect(HOUSES.map(house => house.scope.kind)).toEqual([...Array<string>(9).fill("row"), ...Array<string>(9).fill("column"), ...Array<string>(9).fill("box")]);
        expect(HOUSES[1].cells[4]).toEqual({ row: 1, column: 4 });
        expect(HOUSES[9 + 2].cells[5]).toEqual({ row: 5, column: 2 });
        expect(HOUSES[18 + 5].scope).toEqual({ kind: "box", boxRow: 3, boxColumn: 6 });
        expect(HOUSES[18 + 5].cells.map(({ row, column }) => `${row}${column}`)).toEqual(["36", "37", "38", "46", "47", "48", "56", "57", "58"]);
    });

    it("should give the start of a box band", () => {
        expect([0, 2, 3, 5, 8].map(boxStart)).toEqual([0, 0, 3, 3, 6]);
    });

    it("should pick combinations in lexicographic order", () => {
        expect(combinationsOf([1, 2, 3, 4], 2)).toEqual([[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]]);
        expect(combinationsOf([1, 2], 3)).toEqual([]);
        expect(combinationsOf([1, 2], 0)).toEqual([[]]);
    });
});
