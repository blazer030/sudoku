import { readFileSync } from "fs";

describe("custom scrollbar", () => {
    const css = readFileSync("src/style/index.css", "utf8");

    it("should style scrollbars only for fine pointers", () => {
        const start = css.indexOf("@media (pointer: fine)");
        expect(start).toBeGreaterThan(-1);
        const open = css.indexOf("{", start);
        let depth = 1;
        let position = open + 1;
        while (depth > 0) {
            if (css[position] === "{") depth += 1;
            if (css[position] === "}") depth -= 1;
            position += 1;
        }
        const block = css.slice(open + 1, position - 1);
        const outside = css.slice(0, start) + css.slice(position);

        expect(block).toContain("::-webkit-scrollbar");
        expect(outside).not.toContain("::-webkit-scrollbar");
        expect(block).toContain("scrollbar-width");
        expect(outside).not.toContain("scrollbar-width");
    });
});
