import { boxIndexOf, boxOrigin, boxStart } from "@/domain/board/geometry";

describe("board geometry", () => {
    it("should give the start of a box band", () => {
        expect([0, 2, 3, 5, 6, 8].map(boxStart)).toEqual([0, 0, 3, 3, 6, 6]);
    });

    it("should number boxes from 0 in reading order", () => {
        expect(boxIndexOf(0, 0)).toBe(0);
        expect(boxIndexOf(1, 5)).toBe(1);
        expect(boxIndexOf(4, 2)).toBe(3);
        expect(boxIndexOf(8, 8)).toBe(8);
    });

    it("should place each box's top-left cell", () => {
        expect(boxOrigin(0)).toEqual({ row: 0, column: 0 });
        expect(boxOrigin(5)).toEqual({ row: 3, column: 6 });
        expect(boxOrigin(7)).toEqual({ row: 6, column: 3 });
    });
});
