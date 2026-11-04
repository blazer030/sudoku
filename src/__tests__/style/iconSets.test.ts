import { STYLE_ICON_SETS } from "@/presentation/components/icon/activeIconSet";
import { ICON_NAMES, type IconSet } from "@/style/iconSet";
import { STYLE_IDS, type StyleId } from "@/theme/themeIds";

const stylesWithSets = STYLE_IDS.filter(style => STYLE_ICON_SETS[style] !== null);

const loadSet = (style: StyleId): Promise<IconSet> => {
    const loader = STYLE_ICON_SETS[style];
    if (loader === null) throw new Error(`${style} has no icon set`);
    return loader();
};

const markupOf = (set: IconSet): string => `${set.defs ?? ""}${Object.values(set.drawings).join("")}`;

describe("style icon sets", () => {
    it("should have sets to check", () => {
        expect(stylesWithSets.length).toBeGreaterThan(0);
    });

    describe.each(stylesWithSets)("%s", (style) => {
        it("should draw every icon", async () => {
            const set = await loadSet(style);

            expect(Object.keys(set.drawings).sort()).toEqual([...ICON_NAMES].sort());
            expect(ICON_NAMES.filter(name => set.drawings[name].trim() === "")).toEqual([]);
        });

        it("should only use static shapes, the same in every engine", async () => {
            const markup = markupOf(await loadSet(style));

            expect(markup).not.toMatch(/filter|foreignObject|<image|<animate|<script|<style/i);
        });

        it("should take its colours from the theme", async () => {
            const markup = markupOf(await loadSet(style));
            const colours = [
                ...[...markup.matchAll(/\s(?:fill|stroke|stop-color)="([^"]+)"/g)].map(match => match[1]),
                ...[...markup.matchAll(/[";\s](?:fill|stroke|stop-color):([^";]+)/g)].map(match => match[1]),
            ];
            const allowed = /^(?:currentColor|none|#fff|#000|url\(#\{id\}[-\w]*\)|var\(--[-\w]+\))$/;

            expect(colours.filter(colour => !allowed.test(colour))).toEqual([]);
        });
    });
});
