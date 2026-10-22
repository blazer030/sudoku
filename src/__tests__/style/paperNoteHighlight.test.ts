import { readFileSync } from "fs";
import postcss from "postcss";

const declarationsOf = (selector: string): Map<string, string> => {
    const declarations = new Map<string, string>();
    postcss.parse(readFileSync("src/style/styles/paper/skin.css", "utf8")).walkRules((rule) => {
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

    it("should size the circle to the glyph, not to the note's slot", () => {
        // The slot shrinks with the cell (at 304px a handwritten 2 was wider than its slot and the
        // stroke cut it); an em-based square centred on the digit always clears it
        const note = declarationsOf('[data-style="paper"] [data-note-highlight]');
        expect(note.get("overflow")).toBe("visible");

        const circle = declarationsOf('[data-style="paper"] [data-note-highlight]::after');
        expect(circle.get("inset")).toBeUndefined();
        expect(circle.get("width")).toBe("1.15em");
        expect(circle.get("height")).toBe("1.15em");
        expect(circle.get("top")).toBe("50%");
        expect(circle.get("left")).toBe("50%");
        expect(circle.get("translate")).toBe("-50% -50%");
    });
});
