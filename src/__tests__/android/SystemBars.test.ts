import { readFileSync } from "fs";
import { join } from "path";
import { collectFiles } from "@/__tests__/fixtures/collectFiles";

// The app draws edge to edge on every API level: both system bars are transparent over the page, which
// keeps content clear of them by the safe-area insets. Google Play flags the bar-colour calls Android 15
// deprecated, so the bars take their colours from the theme, and the page's background is painted on
// the window's content frame, which shows under the bars wherever the page does not reach: where
// Capacitor pads the WebView's frame (older WebViews), and under a button navigation bar, which the page
// keeps clear of so its keys never cover what a style draws at the page's edge.

const MAIN_PATH = "android/app/src/main";
const JAVA_PATH = join(MAIN_PATH, "java/io/github/blazer030/sudoku");

const styleBody = (path: string, name: string): string =>
    new RegExp(`<style name="${name.replace(".", "\\.")}"[^>]*>([\\s\\S]*?)</style>`).exec(readFileSync(path, "utf8"))?.[1] ?? "";

const colorValue = (path: string, name: string): string | undefined =>
    new RegExp(`<color name="${name}">([^<]*)</color>`).exec(readFileSync(path, "utf8"))?.[1];

const onCreateBody = (): string => {
    const source = readFileSync(join(JAVA_PATH, "MainActivity.java"), "utf8");
    const start = source.indexOf("public void onCreate(");
    return source.slice(start, source.indexOf("\n    }\n", start));
};

describe("Android system bars", () => {
    it("should not colour the bars through the APIs Android 15 deprecated", () => {
        const offenders = collectFiles(MAIN_PATH)
            .filter(path => /set(?:StatusBar|NavigationBar|NavigationBarDivider)Color\b/.test(readFileSync(path, "utf8")));

        expect(offenders).toEqual([]);
    });

    it("should lay the window out edge to edge once the activity has set its theme", () => {
        const onCreate = onCreateBody();

        // BridgeActivity sets the app theme in super.onCreate, before the window's decor is built
        expect(onCreate).toContain("SystemBarPainter.drawEdgeToEdge(getWindow());");
        expect(onCreate.indexOf("SystemBarPainter.drawEdgeToEdge(")).toBeGreaterThan(onCreate.indexOf("super.onCreate("));
    });

    it("should keep both bars transparent in the app theme", () => {
        const theme = styleBody(join(MAIN_PATH, "res/values/styles.xml"), "AppTheme.NoActionBar");

        expect(theme).toContain('<item name="android:statusBarColor">@android:color/transparent</item>');
        expect(theme).toContain('<item name="android:navigationBarColor">@color/navigation_bar</item>');
        expect(colorValue(join(MAIN_PATH, "res/values-v26/colors.xml"), "navigation_bar")).toBe("@android:color/transparent");
    });

    it("should dim the navigation bar where its icons cannot turn dark", () => {
        // Dark navigation bar icons arrived in API 26; before that its white icons need a dark scrim on a light page
        expect(colorValue(join(MAIN_PATH, "res/values/colors.xml"), "navigation_bar")).toMatch(/^#[0-9a-f]{2}1b1b1b$/i);
    });

    it("should paint the page background on the window's content frame, which Capacitor's SystemBars leaves alone", () => {
        // SystemBars repaints the decor view whenever the page sets the bar style. The content frame holds
        // Capacitor's frame, which it pads by the bars on WebViews before 140, and is itself padded by a
        // button navigation bar, so its background is what shows under the bars.
        const painter = readFileSync(join(JAVA_PATH, "SystemBarPainter.java"), "utf8");

        expect(painter).toMatch(/window\.findViewById\(android\.R\.id\.content\)\.setBackgroundColor\(colors\.background\(\)\)/);
    });

    it("should keep the page clear of a button navigation bar from the moment the activity has its views", () => {
        const onCreate = onCreateBody();

        // Capacitor's frame exists once super.onCreate has set up the bridge
        expect(onCreate).toContain("SystemBarPainter.keepClearOfButtonNavigationBar(getWindow());");
        expect(onCreate.indexOf("SystemBarPainter.keepClearOfButtonNavigationBar(")).toBeGreaterThan(onCreate.indexOf("super.onCreate("));
    });

    it("should take the button navigation bar out of the insets before Capacitor's SystemBars reads them", () => {
        // SystemBars listens on the WebView's frame; the content frame round it sees the insets first, so
        // the bar is neither padded twice nor passed to the page as a safe-area inset
        const painter = readFileSync(join(JAVA_PATH, "SystemBarPainter.java"), "utf8");

        expect(painter).toMatch(/ViewCompat\.setOnApplyWindowInsetsListener\(window\.findViewById\(android\.R\.id\.content\)/);
        expect(painter).toContain("WindowInsetsCompat.Type.tappableElement()");
        expect(painter).toMatch(/return insets\.inset\(reserved\.left\(\), 0, reserved\.right\(\), reserved\.bottom\(\)\)/);
    });
});
