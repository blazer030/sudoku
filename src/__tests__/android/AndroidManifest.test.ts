import { readFileSync } from "fs";

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

        expect(aliases).toHaveLength(6);
        for (const alias of aliases) {
            expect(alias).toContain('android:targetActivity=".MainActivity"');
        }
    });
});
