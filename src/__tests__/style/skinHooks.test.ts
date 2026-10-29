import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const collectFiles = (directory: string, extension: string): string[] =>
    readdirSync(directory).flatMap((name) => {
        const path = join(directory, name);
        if (statSync(path).isDirectory()) return collectFiles(path, extension);
        return name.endsWith(extension) ? [path] : [];
    });

const VUE_FILES = collectFiles("src/presentation", ".vue");
const STYLE_SHEETS = collectFiles("src/style/styles", ".css");

const FILLED_SURFACE = /\bbg-(?:primary|primary-light|card)\b/;

// An opening tag, skipping over quoted attribute values so an arrow function's ">" does not end it
const openingTags = (source: string, names: string): string[] =>
    [...source.matchAll(new RegExp(`<(?:${names})\\b(?:[^>"']|"[^"]*"|'[^']*')*>`, "g"))].map(([tag]) => tag);

const hasSkinToken = (tag: string, token: string): boolean =>
    (/\bdata-skin="([^"]*)"/.exec(tag)?.[1] ?? "").split(/\s+/).includes(token);

// Pressable buttons and links whose resting look is a filled surface, without a skin hook
const findUnmarkedFilledButtons = (path: string, source: string): string[] =>
    openingTags(source, "button|a")
        .filter(tag => /\bv-press\b(?!:tint)/.test(tag) && FILLED_SURFACE.test(tag) && !tag.includes("data-skin="))
        .map(tag => `${path}: ${(/data-testid="([^"]+)"/.exec(tag)?.[1] ?? tag.replace(/\s+/g, " ").slice(0, 80))}`);

// Tokens a stylesheet matches with [data-skin~="x"] or [data-skin="x"]
const styledSkinTokens = (css: string): string[] =>
    [...css.matchAll(/\[data-skin~?="([^"]+)"\]/g)].map(match => match[1]);

// Tokens of every data-skin attribute: static values and string literals inside bound values. A static
// `skin` prop counts too: SegmentedControl adds it to its own data-skin.
const markupSkinTokens = (source: string): string[] =>
    [...source.matchAll(/(?<![\w-])(:?)(?:data-)?skin="([^"]*)"/g)].flatMap(([, bound, value]) => {
        const text = bound === ":" ? [...value.matchAll(/'([^']*)'|`([^`]*)`/g)].map(literal => literal.slice(1).join("")).join(" ") : value;
        return text.split(/\s+/).filter(token => token !== "");
    });

describe("skin hooks", () => {
    it("should find the hooks in sample markup and styles", () => {
        expect(findUnmarkedFilledButtons("Sample.vue", '<button v-press class="bg-primary">')).toHaveLength(1);
        expect(findUnmarkedFilledButtons("Sample.vue", '<button v-press:tint class="bg-card">')).toHaveLength(0);
        expect(findUnmarkedFilledButtons("Sample.vue", '<button v-press class="bg-card" data-skin="button">')).toHaveLength(0);
        expect(findUnmarkedFilledButtons("Sample.vue", '<button v-press @click="() => go()" class="bg-card">')).toHaveLength(1);
        expect(styledSkinTokens('[data-style="paper"] [data-skin~="new-game"]::before, [data-skin="board"] {}')).toEqual(["new-game", "board"]);
        expect(markupSkinTokens('<div data-skin="button new-game"><span :data-skin="pressed ? \'tile on\' : \'tile\'">')).toEqual(["button", "new-game", "tile", "on", "tile"]);
    });

    it("should mark every filled pressable button with a skin", () => {
        const offenders = VUE_FILES.flatMap(path => findUnmarkedFilledButtons(path, readFileSync(path, "utf8")));

        expect(offenders).toEqual([]);
    });

    it("should only style hooks that exist in the markup", () => {
        const markupTokens = new Set(VUE_FILES.flatMap(path => markupSkinTokens(readFileSync(path, "utf8"))));
        const missing = STYLE_SHEETS.flatMap(path =>
            styledSkinTokens(readFileSync(path, "utf8")).filter(token => !markupTokens.has(token)).map(token => `${path}: ${token}`));

        expect(missing).toEqual([]);
    });

    // A button that is only its words (a dialog's cancel or second action, Settings' Clear Records) has no
    // surface of its own but a hover wash in the button's rounded shape; it carries a hook so a style can shape it
    it("should mark every text-only rounded button as a text button", () => {
        const offenders = VUE_FILES.flatMap(path => openingTags(readFileSync(path, "utf8"), "button")
            .filter(tag => /\brounded-button\b/.test(tag) && !/[\s"]bg-/.test(tag) && !hasSkinToken(tag, "button") && !hasSkinToken(tag, "text-button"))
            .map(tag => `${path}: ${(/data-testid="([^"]+)"/.exec(tag)?.[1] ?? tag.replace(/\s+/g, " ").slice(0, 80))}`));

        expect(offenders).toEqual([]);
    });

    it("should mark the Settings and 外觀 pages' cards as settings cards", () => {
        const groupCards = openingTags(readFileSync("src/presentation/pages/settings/components/SettingsGroup.vue", "utf8"), "div")
            .filter(tag => hasSkinToken(tag, "card"));
        const appearanceCards = openingTags(readFileSync("src/presentation/pages/settings/Appearance.vue", "utf8"), "div")
            .filter(tag => hasSkinToken(tag, "card"));

        expect(groupCards).toHaveLength(1);
        expect(appearanceCards).toHaveLength(2);
        expect([...groupCards, ...appearanceCards].every(tag => hasSkinToken(tag, "settings-card"))).toBe(true);
    });

    it("should mark Statistics' section headings and its figures", () => {
        const tags = openingTags(readFileSync("src/presentation/pages/statistics/Statistics.vue", "utf8"), "span");

        // Overview, By Difficulty and Recent Games
        expect(tags.filter(tag => hasSkinToken(tag, "stat-heading"))).toHaveLength(3);
        // The overview's three numbers and each difficulty's best, average and completed
        expect(tags.filter(tag => hasSkinToken(tag, "stat-value"))).toHaveLength(6);
    });

    it("should mark opaque page roots and sticky headers, so a style's page background reaches them", () => {
        const offenders = VUE_FILES.flatMap(path => openingTags(readFileSync(path, "utf8"), "div")
            .filter(tag => /\bbg-background\b/.test(tag))
            .filter(tag => (/\bsticky\b/.test(tag) && !hasSkinToken(tag, "page-header"))
                || (/\boverflow-y-auto\b/.test(tag) && !hasSkinToken(tag, "page")))
            .map(tag => `${path}: ${tag.replace(/\s+/g, " ").slice(0, 90)}`));

        expect(offenders).toEqual([]);
    });

    // A raised card surface (a card fill, rounded, with a card shadow) is a panel a style may frame; it carries
    // a skin hook so a style can draw it, instead of leaving it as an unframed slab
    it("should mark every raised card panel with a skin hook", () => {
        const offenders = VUE_FILES.flatMap(path => openingTags(readFileSync(path, "utf8"), "div|section")
            .filter(tag => /\bbg-card\b/.test(tag) && /\brounded-(?:xl|2xl)\b/.test(tag) && /\bshadow-card/.test(tag))
            .filter(tag => !/\bdata-skin=/.test(tag))
            .map(tag => `${path}: ${tag.replace(/\s+/g, " ").slice(0, 90)}`));

        expect(offenders).toEqual([]);
    });

    it("should mark the continue card's arrow, so a style can draw it", () => {
        const source = readFileSync("src/presentation/components/continue-button/ContinueButton.vue", "utf8");

        expect(openingTags(source, "Play").some(tag => hasSkinToken(tag, "caret"))).toBe(true);
    });

    it("should mark the hint menu as a card, so a style frames it like the dialogs", () => {
        const source = readFileSync("src/presentation/pages/game/components/HintMenuPopup.vue", "utf8");
        const menuTag = openingTags(source, "div").find(tag => tag.includes('data-testid="hint-menu"'));

        expect(menuTag).toBeDefined();
        expect(hasSkinToken(menuTag ?? "", "card")).toBe(true);
    });

    it("should mark every dialog heading as a dialog title", () => {
        const dialogs = [
            "src/presentation/components/new-game-dialog/NewGameDialog.vue",
            "src/presentation/pages/game/components/LeaveGameDialog.vue",
            "src/presentation/pages/settings/components/ClearRecordsDialog.vue",
            "src/presentation/pages/solver-walkthrough/WalkthroughDialog.vue",
        ];

        for (const path of dialogs) {
            const headings = openingTags(readFileSync(path, "utf8"), "h2");
            expect(headings.length, path).toBeGreaterThan(0);
            expect(headings.every(tag => hasSkinToken(tag, "dialog-title")), path).toBe(true);
        }
    });

    it("should keep the skin hooks GameScreen measures", () => {
        const source = readFileSync("src/presentation/pages/game/GameScreen.vue", "utf8");
        const boardTag = openingTags(source, "\\w+").find(tag => tag.includes('data-testid="game-board"'));

        expect(boardTag).toBeDefined();
        expect(hasSkinToken(boardTag ?? "", "board")).toBe(true);
    });
});
