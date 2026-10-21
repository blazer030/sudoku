import { readFileSync } from "fs";
import { renderThemeCss } from "@/theme/renderThemeCss";

describe("themes.generated.css", () => {
    it("should match the output of renderThemeCss (run npm run generate:theme-css)", () => {
        expect(readFileSync("src/style/themes.generated.css", "utf8")).toBe(renderThemeCss());
    });

    it("should contain a dark block per theme and the palette values", () => {
        const css = renderThemeCss();

        expect(css).toContain(':root.dark[data-style="minimal"][data-color-theme="teal"] {');
        expect(css).toContain("--color-primary: #4A9A9A;");
    });
});
