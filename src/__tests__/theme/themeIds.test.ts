import { STYLE_COLOR_MODES, STYLE_IDS, effectiveColorMode } from "@/theme/themeIds";

describe("themeIds colour modes", () => {
    it("lets paper be light only", () => {
        expect(effectiveColorMode("paper", "dark")).toBe("light");
    });

    it("keeps dark for tactile", () => {
        expect(effectiveColorMode("tactile", "dark")).toBe("dark");
    });

    it("lets cyber be dark only", () => {
        expect(effectiveColorMode("cyber", "light")).toBe("dark");
    });

    it("gives every style light, except the dark-only cyber", () => {
        STYLE_IDS.filter(style => style !== "cyber").forEach(style => {
            expect(STYLE_COLOR_MODES[style]).toContain("light");
        });
        expect(STYLE_COLOR_MODES.cyber).toEqual(["dark"]);
    });
});
