import { readFileSync } from "fs";

// The manifest leaves orientation to MainActivity (see AndroidManifest.test.ts), so the activity asks
// for portrait on a phone itself, judged by the display, not its own (possibly letterboxed) window.
// Asked before the activity sets up its window and WebView, a phone held sideways at launch turns
// once, under the splash screen, not after the page has appeared.

const MAIN_ACTIVITY_PATH = "android/app/src/main/java/io/github/blazer030/sudoku/MainActivity.java";

const methodBody = (name: string): string => {
    const source = readFileSync(MAIN_ACTIVITY_PATH, "utf8");
    const start = source.indexOf(`public void ${name}(`);
    const end = source.indexOf("\n    }\n", start);
    return start === -1 ? "" : source.slice(start, end);
};

describe("MainActivity", () => {
    it("should ask for the display's orientation before the activity sets itself up", () => {
        const onCreate = methodBody("onCreate");

        expect(onCreate).toContain("followDisplaySize();");
        expect(onCreate.indexOf("followDisplaySize(")).toBeLessThan(onCreate.indexOf("super.onCreate("));
    });

    it("should ask again when a fold or unfold changes the display without recreating the activity", () => {
        expect(methodBody("onConfigurationChanged")).toContain("followDisplaySize();");
    });
});
