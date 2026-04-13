import { updateMetaThemeColor } from "@/application/PwaThemeUpdater";

describe("PwaThemeUpdater", () => {
    describe("updateMetaThemeColor", () => {
        afterEach(() => {
            document.head.innerHTML = "";
        });

        it("should set meta theme-color content to the theme primary color", () => {
            const meta = document.createElement("meta");
            meta.name = "theme-color";
            meta.content = "#000000";
            document.head.appendChild(meta);

            updateMetaThemeColor("blue");

            expect(meta.content).toBe("#4A7AB5");
        });

        it("should not throw when meta theme-color element is missing", () => {
            expect(() => updateMetaThemeColor("blue")).not.toThrow();
        });
    });
});
