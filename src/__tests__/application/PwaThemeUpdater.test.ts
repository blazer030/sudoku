import { updateMetaThemeColor, updateFavicon, updateManifestLink } from "@/application/PwaThemeUpdater";

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

    describe("updateFavicon", () => {
        afterEach(() => {
            document.head.innerHTML = "";
        });

        it("should set icon link href to themed svg path", () => {
            const link = document.createElement("link");
            link.rel = "icon";
            link.href = "/sudoku-green.svg";
            document.head.appendChild(link);

            updateFavicon("purple");

            expect(link.href).toContain("sudoku-purple.svg");
        });

        it("should not throw when icon link is missing", () => {
            expect(() => updateFavicon("blue")).not.toThrow();
        });
    });

    describe("updateManifestLink", () => {
        afterEach(() => {
            document.head.innerHTML = "";
        });

        it("should set manifest link href to themed webmanifest path", () => {
            const link = document.createElement("link");
            link.rel = "manifest";
            link.href = "/manifest-green.webmanifest";
            document.head.appendChild(link);

            updateManifestLink("orange");

            expect(link.href).toContain("manifest-orange.webmanifest");
        });

        it("should not throw when manifest link is missing", () => {
            expect(() => updateManifestLink("blue")).not.toThrow();
        });
    });
});
