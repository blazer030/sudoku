import { readFileSync } from "fs";
import { declarationsOf } from "@/__tests__/style/styleSheetRules";

// Paper rules every page: the ruled lines and red margin line run behind each page's content, while
// cards, the board's sheet and sticky headers sit on top of them.

const PAPER_CSS = readFileSync("src/style/styles/paper/skin.css", "utf8");

const isRuled = (selector: string): boolean => {
    const image = declarationsOf(PAPER_CSS, selector).get("background-image") ?? "";
    return image.includes("var(--color-rule)") && image.includes("var(--color-margin-line)");
};

// An opening tag, skipping over quoted attribute values
const firstTag = (source: string): string =>
    /<template>\s*(<[\w-]+\b(?:[^>"']|"[^"]*"|'[^']*')*>)/.exec(source)?.[1] ?? "";

const skinTokens = (tag: string): string[] => (/\bdata-skin="([^"]*)"/.exec(tag)?.[1] ?? "").split(/\s+/).filter(Boolean);

const ROUTED_PAGES = [...readFileSync("src/router.ts", "utf8").matchAll(/from "@\/(presentation\/pages\/[\w/-]+\.vue)"/g)]
    .map(([, path]) => `src/${path}`);

describe("paper ruled pages", () => {
    it("should rule every page root and the ruled hook alike", () => {
        expect(isRuled('[data-style="paper"] [data-skin~="page"]')).toBe(true);
        expect(isRuled('[data-style="paper"] [data-skin~="page-ruled"]')).toBe(true);
    });

    it("should rule the app's page scroller, so pages without an opaque root of their own are ruled too", () => {
        const app = readFileSync("src/presentation/App.vue", "utf8");
        const scroller = /<div\b(?:[^>"']|"[^"]*"|'[^']*')*data-testid="page-scroller"(?:[^>"']|"[^"]*"|'[^']*')*>/.exec(app)?.[0] ?? "";

        expect(skinTokens(scroller)).toContain("page-ruled");
    });

    it("should leave no routed page painting an unruled background over the scroller", () => {
        expect(ROUTED_PAGES.length).toBeGreaterThanOrEqual(8);
        const offenders = ROUTED_PAGES.filter((path) => {
            const tag = firstTag(readFileSync(path, "utf8"));
            const opaque = /\bbg-[\w-]+/.test(tag);
            const ruled = skinTokens(tag).some(token => token === "page" || token === "page-ruled");
            return opaque && !ruled;
        });

        expect(offenders).toEqual([]);
    });

    it("should leave a sticky header clear at rest, so the lines and margin line run through it", () => {
        const header = declarationsOf(PAPER_CSS, '[data-style="paper"] [data-skin~="page-header"]');

        expect(header.get("background-color")).toBe("transparent");
        expect(header.has("background-image")).toBe(false);
        expect(header.has("backdrop-filter")).toBe(false);
    });

    it("should frost a scrolled sticky header, with no rule underneath", () => {
        const scrolled = declarationsOf(PAPER_CSS, '[data-style="paper"] [data-skin~="page-header"][data-scrolled]');

        expect(scrolled.get("background-color")).toMatch(/^color-mix\(in srgb, var\(--color-background\) calc\(\d+% \* var\(--header-scroll, 0\)\), transparent\)$/);
        expect(scrolled.get("backdrop-filter")).toMatch(/^blur\(calc\(\d+px \* var\(--header-scroll, 0\)\)\)$/);
        expect(scrolled.get("-webkit-backdrop-filter")).toBe(scrolled.get("backdrop-filter"));
        expect(scrolled.has("background-image")).toBe(false);
        expect(scrolled.has("box-shadow")).toBe(false);
    });
});
