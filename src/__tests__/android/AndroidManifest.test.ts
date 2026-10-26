import { readFileSync } from "fs";
import { ALL_LAUNCHER_ALIASES } from "@/theme/launcherIcon";

// The layout is designed for portrait only: in landscape the board and the digit row
// cannot both fit above the navigation bar.

const MANIFEST_PATH = "android/app/src/main/AndroidManifest.xml";

const mainActivityTag = (): string =>
    /<activity\b[^>]*android:name="\.MainActivity"[^>]*>/.exec(readFileSync(MANIFEST_PATH, "utf8"))?.[0] ?? "";

describe("Android manifest", () => {
    it("should lock the main activity to portrait", () => {
        expect(mainActivityTag()).toContain('android:screenOrientation="portrait"');
    });

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
