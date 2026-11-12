import { STYLE_FONT_GATES } from "@/style/fontGates";
import { STYLE_IDS } from "@/theme/themeIds";

describe("STYLE_FONT_GATES", () => {
    it("should decide every style's faces, the app's own ones only for minimal and tactile", () => {
        expect(Object.keys(STYLE_FONT_GATES).sort()).toEqual([...STYLE_IDS].sort());
        expect(STYLE_IDS.filter(style => STYLE_FONT_GATES[style] === null)).toEqual(["minimal", "tactile"]);
    });
});
