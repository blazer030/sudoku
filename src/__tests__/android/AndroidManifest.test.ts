import { readFileSync } from "fs";
import { ALL_LAUNCHER_ALIASES } from "@/theme/launcherIcon";

// Phones are kept in portrait by MainActivity (OrientationPolicy), not the manifest, so large
// screens and split windows can turn and resize as Google Play asks.

const MANIFEST_PATH = "android/app/src/main/AndroidManifest.xml";

const mainActivityTag = (): string =>
    /<activity\b[^>]*android:name="\.MainActivity"[^>]*>/.exec(readFileSync(MANIFEST_PATH, "utf8"))?.[0] ?? "";

describe("Android manifest", () => {
    it("should leave the main activity's orientation to MainActivity", () => {
        expect(mainActivityTag()).not.toContain("android:screenOrientation");
    });

    it.each(["orientation", "screenSize", "smallestScreenSize", "screenLayout"])(
        "should keep the WebView when the window's %s changes (turning, split screen, a foldable)",
        (change) => {
            const configChanges = /android:configChanges="([^"]*)"/.exec(mainActivityTag())?.[1].split("|") ?? [];

            expect(configChanges).toContain(change);
        },
    );

    it("should launch every theme icon alias into the main activity", () => {
        // An activity-alias has no orientation of its own; it opens its target activity
        const aliases = readFileSync(MANIFEST_PATH, "utf8").match(/<activity-alias\b[^>]*>/g) ?? [];

        expect(aliases).toHaveLength(ALL_LAUNCHER_ALIASES.length);
        for (const alias of aliases) {
            expect(alias).toContain('android:targetActivity=".MainActivity"');
        }
    });

    // The app shows no ads, so analytics counts players by Firebase's own random id, never the advertising id
    it("should keep analytics from collecting the advertising id", () => {
        expect(readFileSync(MANIFEST_PATH, "utf8")).toMatch(
            /<meta-data\s+android:name="google_analytics_adid_collection_enabled"\s+android:value="false"\s*\/>/,
        );
    });

    it.each([
        "com.google.android.gms.permission.AD_ID",
        "android.permission.ACCESS_ADSERVICES_AD_ID",
        "android.permission.ACCESS_ADSERVICES_ATTRIBUTION",
    ])("should strip the %s permission the analytics library would merge in", (permission) => {
        const declaration = new RegExp(`<uses-permission\\s+android:name="${permission.replace(/\./g, "\\.")}"\\s+tools:node="remove"\\s*/>`);

        expect(readFileSync(MANIFEST_PATH, "utf8")).toMatch(declaration);
    });

    it("should turn off automatic screen reports so analytics shows only our screen names", () => {
        expect(readFileSync(MANIFEST_PATH, "utf8")).toMatch(
            /<meta-data\s+android:name="google_analytics_automatic_screen_reporting_enabled"\s+android:value="false"\s*\/>/,
        );
    });
});
