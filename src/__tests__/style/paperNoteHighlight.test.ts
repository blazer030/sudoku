import { readFileSync } from "fs";
import postcss from "postcss";

const declarationsOf = (selector: string): Map<string, string> => {
    const declarations = new Map<string, string>();
    postcss.parse(readFileSync("src/style/styles/paper.css", "utf8")).walkRules((rule) => {
        if (rule.parent?.type === "atrule" || !rule.selectors.includes(selector)) return;
        rule.walkDecls((declaration) => {
            declarations.set(declaration.prop, declaration.value.trim());
        });
    });
    return declarations;
};

describe("paper note highlight", () => {
    it("should circle the highlighted note by hand instead of filling a disc behind it", () => {
        // A filled disc behind a thin handwritten digit read poorly; the selected cell's pen circle is clearer
        const note = declarationsOf('[data-style="paper"] [data-note-highlight]');
        expect(note.get("background-color")).toBe("transparent");
        expect(note.get("color")).toBe("var(--color-primary)");
        expect(note.get("position")).toBe("relative");

        const circle = declarationsOf('[data-style="paper"] [data-note-highlight]::after');
        expect(circle.get("background-color")).toBe("var(--color-primary)");
        expect(circle.get("mask")).toContain("data:image/svg+xml");
    });
});
