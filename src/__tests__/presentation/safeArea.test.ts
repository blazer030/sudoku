import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "@/presentation/App.vue";

// The app draws edge to edge, so the page background sits under the Android system bars.
// Content is kept clear of them with the safe-area insets.

const collectVueFiles = (directory: string): string[] =>
    readdirSync(directory).flatMap((name) => {
        const path = join(directory, name);
        if (statSync(path).isDirectory()) return collectVueFiles(path);
        return name.endsWith(".vue") ? [path] : [];
    });

describe("safe area", () => {
    it("should let the page extend under the system bars", () => {
        const viewport = /<meta[^>]*name="viewport"[^>]*>/.exec(readFileSync("index.html", "utf8"))?.[0] ?? "";

        expect(viewport).toContain("viewport-fit=cover");
    });

    it("should pad the app root by every safe-area inset", () => {
        const router = createRouter({ history: createMemoryHistory(), routes: [{ path: "/", component: { template: "<div />" } }] });
        const wrapper = mount(App, { global: { plugins: [router] } });
        const css = readFileSync("src/style/index.css", "utf8");
        const rule = /\.app-safe-area\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";

        expect(wrapper.classes()).toContain("app-safe-area");
        for (const side of ["top", "right", "bottom", "left"]) {
            // Capacitor injects --safe-area-inset-* on Android WebViews whose env() values are wrong
            expect(rule).toContain(`padding-${side}: var(--safe-area-inset-${side}, env(safe-area-inset-${side}))`);
        }
    });

    it("should scroll a page taller than the safe area inside the padded root", () => {
        const page = { template: '<div data-testid="page" />' };
        const router = createRouter({ history: createMemoryHistory(), routes: [{ path: "/", component: page }] });
        const wrapper = mount(App, { global: { plugins: [router] } });
        const scroller = wrapper.find('[data-testid="page-scroller"]');

        // The scroller fills the root's padded box and clips there, so the last row of a tall
        // page scrolls up to the bottom inset instead of running under the navigation bar
        expect(scroller.element.parentElement).toBe(wrapper.element);
        expect(scroller.classes()).toEqual(expect.arrayContaining(["h-full", "overflow-y-auto"]));
        expect(wrapper.classes()).not.toContain("overflow-y-auto");
    });

    it("should size pages to the padded root instead of the whole viewport", () => {
        const offenders = collectVueFiles("src/presentation/pages").filter(path => /\bh-(?:dvh|screen)\b/.test(readFileSync(path, "utf8")));

        expect(offenders).toEqual([]);
    });

    it("should lift bottom-anchored floating elements above the bottom inset", () => {
        const floating = [
            "src/presentation/pages/game/components/GameToast.vue",
            "src/presentation/pages/game/components/HintMenuPopup.vue",
            "src/presentation/pages/donate/Donate.vue",
        ];

        for (const path of floating) {
            const source = readFileSync(path, "utf8");
            expect(source, path).toContain("bottom-safe-24");
            expect(source, path).not.toMatch(/\bbottom-24\b/);
        }
        expect(readFileSync("src/style/index.css", "utf8"))
            .toContain("bottom: calc(6rem + var(--safe-area-inset-bottom, env(safe-area-inset-bottom)))");
    });
});
