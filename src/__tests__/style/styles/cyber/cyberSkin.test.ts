import { readFileSync } from "fs";
import postcss, { type AtRule, type Declaration, type Rule } from "postcss";
import { ARRIVAL_SETTLE_MS } from "@/presentation/components/board-cell/useArrivalMotion";
import { declarationsOf } from "../../styleSheetRules";

const CYBER_CSS = readFileSync("src/style/styles/cyber/skin.css", "utf8");

const SCOPE = '[data-style="cyber"]';
const FONTS_READY = '[data-style="cyber"][data-cyber-fonts="ready"]';
// The panels' paint weighs one pseudo-class more than a component's scoped styles (the hint panel's buttons)
const PAINT_SCOPE = ':root[data-style="cyber"]';

const skin = (token: string): string => `${SCOPE} [data-skin~="${token}"]`;
const paintOf = (token: string): Map<string, string> => declarationsOf(CYBER_CSS, `${PAINT_SCOPE} [data-skin~="${token}"]`);

const collapse = (text: string): string => text.replace(/\s+/g, " ").trim();

const allRules = (): Rule[] => {
    const rules: Rule[] = [];
    postcss.parse(CYBER_CSS).walkRules((rule) => {
        rules.push(rule);
    });
    return rules;
};

const allDeclarations = (property: RegExp): Declaration[] => {
    const declarations: Declaration[] = [];
    postcss.parse(CYBER_CSS).walkDecls(property, (declaration) => {
        declarations.push(declaration);
    });
    return declarations;
};

// The declarations of the rules inside an @media block whose params include `params`, listing `selector`
const mediaDeclarationsOf = (params: string, selector: string): Map<string, string> => {
    const declarations = new Map<string, string>();
    postcss.parse(CYBER_CSS).walkRules((rule) => {
        const parent = rule.parent;
        if (parent?.type !== "atrule" || (parent as AtRule).name !== "media" || !(parent as AtRule).params.includes(params)) return;
        if (!rule.selectors.map(collapse).includes(selector)) return;
        rule.walkDecls((declaration) => {
            declarations.set(declaration.prop, collapse(declaration.value));
        });
    });
    return declarations;
};

// Lit pieces: a deep magenta fill behind pink text, with a magenta edge
const LIT = {
    "a tile that is on": `${skin("tile")}[aria-pressed="true"]`,
    "a checked tile": `${skin("tile")}[aria-checked="true"]`,
    "the chosen key": `${skin("key")}[aria-pressed="true"]`,
    "the chosen segment": `${skin("segment")}[aria-pressed="true"]`,
    "an active game control": `${SCOPE} [aria-pressed="true"] > [data-skin~="control"]`,
    "a primary button": `${skin("button")}:is(.bg-primary, .hint-primary, [data-skin~="new-game"])`,
} as const;

describe("cyber skin", () => {
    describe("type", () => {
        it("should set digits in Orbitron, and the timer and notes in Share Tech Mono, once the faces have loaded", () => {
            const fonts = declarationsOf(CYBER_CSS, FONTS_READY);

            for (const token of ["--font-clue", "--font-entry", "--font-key"]) {
                expect(fonts.get(token), token).toBe("var(--font-cyber-digits)");
            }
            expect(fonts.get("--font-timer")).toBe("var(--font-cyber-mono)");
            expect(fonts.get("--font-note")).toBe("var(--font-cyber-mono)");
        });

        it("should set every other text in the system sans, without Outfit", () => {
            const sans = declarationsOf(CYBER_CSS, FONTS_READY).get("--font-sans") ?? "";

            expect(sans).toContain("PingFang TC");
            expect(sans).not.toContain("Outfit");
        });

        it("should repoint no font outside the fonts-ready gate", () => {
            const ungated = allDeclarations(/^--font-/).filter(declaration =>
                declaration.parent?.type !== "rule"
                || (declaration.parent as Rule).selectors.some(selector => !selector.trim().startsWith(FONTS_READY)));

            expect(ungated.map(declaration => declaration.prop)).toEqual([]);
        });
    });

    describe("panels", () => {
        const CUT = ["card", "button", "tile", "key", "control", "segment", "pill", "tag", "board"];

        it.each(CUT)("should cut the corners of %s", (token) => {
            const ending = new RegExp(`\\[data-skin~="${token}"\\](?:::before|::after)?$`);
            const clipPaths = allRules()
                .filter(rule => rule.selectors.some(selector => ending.test(collapse(selector))))
                .flatMap(rule => rule.nodes.filter((node): node is Declaration => node.type === "decl" && node.prop === "clip-path"));

            expect(clipPaths.some(declaration => declaration.value.trim().startsWith("polygon("))).toBe(true);
        });

        it.each(["card", "button", "tile", "key", "control", "segment", "pill", "tag"])(
            "should draw %s as its edge around its fill",
            (token) => {
                const paint = paintOf(token);

                expect(paint.get("background"), token).toContain("var(--cyber-edge)");
                expect(paint.get("background"), token).toMatch(/var\(--cyber-fill\)$/);
                expect(paint.get("border-color"), token).toBe("transparent");
            },
        );

        it("should rest every panel on the card colour inside the cyan edge", () => {
            const rest = declarationsOf(CYBER_CSS, skin("card"));

            expect(rest.get("--cyber-edge")).toBe("var(--color-border)");
            expect(rest.get("--cyber-fill")).toBe("var(--color-card)");
        });

        it.each(Object.entries(LIT))("should light %s as a deep magenta fill behind pink text", (_name, selector) => {
            const lit = declarationsOf(CYBER_CSS, selector);

            expect(lit.get("--cyber-fill")).toBe("var(--color-primary-light)");
            expect(lit.get("--cyber-edge")).toBe("var(--color-primary)");
            expect(lit.get("color")).toBe("var(--color-primary-ink)");
        });

        it("should draw a segmented control as separate panels, with no strip edge and no sliding indicator", () => {
            const strip = declarationsOf(CYBER_CSS, skin("segmented"));

            expect(strip.get("--segmented-gap")).toBe("6px");
            expect(strip.get("--segmented-padding")).toBe("0px");
            expect(strip.get("background")).toBe("none");
            expect(strip.get("box-shadow")).toBe("none");
            expect(paintOf("segmented").has("clip-path")).toBe(false);
            expect(declarationsOf(CYBER_CSS, skin("segmented-indicator")).get("visibility")).toBe("hidden");
        });

        it("should put no text on a bright magenta or yellow block, except the remaining-count badge", () => {
            const BRIGHT = /var\(--color-(?:primary|signal)\)/;
            const offenders = allRules()
                .filter(rule => !rule.selectors.some(selector => selector.includes('[data-skin~="badge"]')))
                .filter((rule) => {
                    const declarations = rule.nodes.filter((node): node is Declaration => node.type === "decl");
                    const bright = declarations.some(declaration =>
                        ["background", "background-color", "--cyber-fill"].includes(declaration.prop) && BRIGHT.test(declaration.value));
                    return bright && declarations.some(declaration => declaration.prop === "color");
                })
                .map(rule => rule.selector);

            expect(offenders).toEqual([]);
        });

        it.each([
            ["the hint-mode pill", `${skin("pill")}[data-skin~="hint"]`],
            ["the new-record badge", `${skin("tag")}[data-skin~="new-record"]`],
        ])("should draw %s as a deep yellow fill behind yellow text", (_name, selector) => {
            const yellow = declarationsOf(CYBER_CSS, selector);

            expect(yellow.get("--cyber-fill")).toBe("var(--color-signal-surface)");
            expect(yellow.get("--cyber-edge")).toBe("var(--color-signal)");
            expect(yellow.get("color")).toBe("var(--color-signal)");
        });

        it("should draw the danger button as a deep red fill behind red text, in a red edge", () => {
            const danger = declarationsOf(CYBER_CSS, `${skin("button")}.bg-danger`);

            expect(danger.get("--cyber-fill")).toBe("var(--color-error-surface)");
            expect(danger.get("--cyber-edge")).toBe("var(--color-error)");
            expect(danger.get("color")).toBe("var(--color-error)");
        });

        it("should draw the remaining-count badge as a notched yellow tag with near-black digits", () => {
            const badge = declarationsOf(CYBER_CSS, skin("badge"));

            expect(badge.get("background-color")).toBe("var(--color-signal)");
            expect(badge.get("color")).toBe("var(--color-background)");
            expect(badge.get("clip-path")).toMatch(/^polygon\(/);
        });

        it("should keep a hovered button's fill over a component's own hover colour (the hint panel's primary)", () => {
            // .hint-primary[data-v][data-v]:hover (0,4,0) sets the bright primary in a scoped style that loads after this sheet
            expect(declarationsOf(CYBER_CSS, `${PAINT_SCOPE} [data-skin~="button"]:enabled:hover`).get("background-color")).toBe("var(--cyber-fill)");
        });

        it("should light a final step's tag as a deep magenta fill behind pink text, in a magenta edge", () => {
            const strong = declarationsOf(CYBER_CSS, `${skin("tag")}[data-skin~="step"][data-skin~="strong"]`);

            expect(strong.get("--cyber-fill")).toBe("var(--color-primary-light)");
            expect(strong.get("--cyber-edge")).toBe("var(--color-primary)");
            expect(strong.get("color")).toBe("var(--color-primary-ink)");
        });

        it("should leave an earlier step's tag as it reads: magenta on the deep fill, without an edge", () => {
            const step = declarationsOf(CYBER_CSS, `${skin("tag")}[data-skin~="step"]`);

            expect(step.get("--cyber-fill")).toBe("var(--color-primary-light)");
            expect(step.get("--cyber-edge")).toBe("transparent");
            expect(step.get("color")).toBe("var(--color-primary)");
        });

        it("should glow a hovered piece in its own edge colour, so a lit piece glows brighter", () => {
            const hovered = mediaDeclarationsOf("(hover: hover)", `${skin("key")}:enabled:hover`);

            expect(hovered.get("--cyber-hover-glow")).toMatch(/var\(--cyber-edge\)/);
            expect(paintOf("key").get("box-shadow")).toContain("var(--cyber-hover-glow, transparent)");
        });
    });

    describe("pages", () => {
        // The app root is on every screen; the decoration hangs there alone, so it exists exactly once at any width
        const ROOT_DECORATION = `${SCOPE} .app-safe-area`;

        it.each(["::before", "::after"])("should hang the page decoration %s on the app root, under the content, never taking taps", (pseudo) => {
            const decoration = declarationsOf(CYBER_CSS, `${ROOT_DECORATION}${pseudo}`);

            expect(decoration.get("content")).toBe('""');
            expect(decoration.get("position")).toBe("fixed");
            expect(decoration.get("pointer-events")).toBe("none");
            expect(Number(decoration.get("z-index"))).toBeLessThan(0);
        });

        it("should draw the decoration once: no page root carries a copy, and page roots let the app root's show through", () => {
            const pagePseudoRules = allRules()
                .filter(rule => rule.selectors.some(selector => /\[data-skin~="page(?:-ruled)?"\]::(?:before|after)$/.test(collapse(selector))))
                .map(rule => rule.selector);

            expect(pagePseudoRules).toEqual([]);
            expect(declarationsOf(CYBER_CSS, skin("page")).get("background-color")).toBe("transparent");
        });

        it("should fade the horizon glow out on both sides: its ellipse sits inside its box, not on the box's edge", () => {
            const background = collapse(declarationsOf(CYBER_CSS, `${ROOT_DECORATION}::before`).get("background") ?? "");
            const glow = /radial-gradient\(\d+% \d+% at (\d+)% (\d+)%, /.exec(background);

            expect(glow).not.toBeNull();
            expect(Number(glow?.[2])).toBeGreaterThan(0);
            expect(Number(glow?.[2])).toBeLessThan(100);
        });

        it("should lay the perspective floor at the bottom of the screen, fading upwards", () => {
            const floor = declarationsOf(CYBER_CSS, `${ROOT_DECORATION}::after`);

            expect(floor.get("transform")).toMatch(/^perspective\(\d+px\) rotateX\(\d+deg\)$/);
            expect(floor.get("mask-image")).toMatch(/^linear-gradient\(to top, /);
        });
    });

    describe("board", () => {
        it("should frame the board in a cyan-to-magenta gradient with 16px cut corners", () => {
            const board = paintOf("board");

            expect(board.get("background")).toMatch(/linear-gradient\(135deg, var\(--cyber-frame-from\), var\(--color-primary\)\)$/);
            expect(declarationsOf(CYBER_CSS, skin("board")).get("--cyber-frame-from")).toBe("var(--color-accent)");
            expect(board.get("clip-path")).toContain("16px");
        });

        it("should cut the grid's top left and bottom right corners to follow the frame", () => {
            const grid = declarationsOf(CYBER_CSS, `${skin("board")} > div`);

            expect(grid.get("clip-path")).toBe("polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)");
        });

        it("should run the magenta outer line along each cut edge, under the selection brackets", () => {
            const brackets = declarationsOf(CYBER_CSS, `${skin("board")}:not([data-hint-mode]) [data-selected]::after`);
            for (const [corner, direction] of [["before", "135deg"], ["after", "315deg"]]) {
                const edge = declarationsOf(CYBER_CSS, `${skin("board")} > div::${corner}`);

                expect(edge.get("content"), corner).toBe('""');
                expect(edge.get("position"), corner).toBe("absolute");
                expect(edge.get("pointer-events"), corner).toBe("none");
                expect(edge.get("background"), corner).toContain(`linear-gradient(${direction}, transparent 33.33%, var(--board-box-line) 0 51%, transparent 0)`);
                expect(Number(edge.get("z-index")), corner).toBeLessThan(Number(brackets.get("z-index")));
            }
        });

        it("should draw magenta box lines and faint cyan cell lines", () => {
            const scope = declarationsOf(CYBER_CSS, SCOPE);

            expect(scope.get("--board-box-line")).toBe("var(--color-primary)");
            expect(scope.get("--board-line")).toBe("color-mix(in srgb, var(--color-accent) 16%, transparent)");
        });

        it("should tag the board GRID 9×9 at the top left, in the mono face on the page colour", () => {
            const tag = declarationsOf(CYBER_CSS, `${skin("board")}::before`);

            expect(tag.get("content")).toContain('"GRID 9×9"');
            expect(tag.get("pointer-events")).toBe("none");
            expect(tag.get("font-family")).toBe("var(--cyber-mono)");
            expect(tag.get("background-color")).toBe("var(--color-background)");
        });

        it("should name the selected cell at the bottom right only while a cell is selected", () => {
            const tag = declarationsOf(CYBER_CSS, `${skin("board")}[data-selected-cell]::after`);

            expect(tag.get("content")).toContain('"CELL " attr(data-selected-cell)');
            expect(tag.get("pointer-events")).toBe("none");
            // Without the attribute there is no tag at all, rather than an empty 「CELL 」
            expect(declarationsOf(CYBER_CSS, `${skin("board")}::after`).get("content")).toBeUndefined();
        });
    });

    describe("cells", () => {
        const BOARD = skin("board");
        const cell = (rest: string): Map<string, string> => declarationsOf(CYBER_CSS, `${BOARD} ${rest}`);

        it("should set a player's digit in cyan with a soft cyan glow", () => {
            const entered = cell('[data-value-kind="entered"] > div');

            expect(entered.get("color")).toBe("var(--color-accent)");
            expect(entered.get("text-shadow")).toMatch(/var\(--color-accent\)/);
        });

        it("should keep a wrong or conflicting entry red", () => {
            for (const variant of ["error", "wrong"]) {
                expect(cell(`[data-variant="${variant}"][data-value-kind="entered"] > div`).get("color"), variant).toBe("var(--color-error)");
            }
        });

        it("should set the selected cell's digit in yellow with a glow, and drop the shared ring", () => {
            const digit = cell('[data-variant="selected"][data-value-kind] > div');

            expect(digit.get("color")).toBe("var(--color-signal)");
            expect(digit.get("text-shadow")).toMatch(/var\(--color-signal\)/);
            expect(cell('[data-variant="selected"]').get("box-shadow")).toBe("none");
        });

        it("should draw four yellow corner brackets on the selected cell's ::after, leaving ::before free", () => {
            const selected = `${BOARD}:not([data-hint-mode]) [data-selected]`;
            const brackets = declarationsOf(CYBER_CSS, `${selected}::after`);

            expect(declarationsOf(CYBER_CSS, selected).get("position")).toBe("relative");
            expect(brackets.get("pointer-events")).toBe("none");
            expect(brackets.get("background")?.match(/var\(--color-signal\)/g)?.length).toBeGreaterThanOrEqual(8);
            expect(allRules().some(rule => rule.selectors.some(selector => collapse(selector).endsWith("[data-selected]::before")))).toBe(false);
        });

        it("should set the same digit in pink", () => {
            expect(cell('[data-variant="same-digit"][data-value-kind] > div').get("color")).toBe("var(--color-primary-ink)");
        });

        it("should set an emphasised note square, in pink on the deep magenta fill", () => {
            const emphasised = cell("[data-note-highlight]");

            expect(emphasised.get("color")).toBe("var(--color-primary-ink)");
            expect(emphasised.get("background-color")).toBe("var(--color-primary-light)");
            expect(emphasised.get("border-radius")).toBe("0");
        });

        it("should draw a hint's answer cell as a yellow wash inside a yellow inset outline", () => {
            const answer = cell('[data-variant="answer"]');

            expect(answer.get("background-color")).toMatch(/^color-mix\(in srgb, var\(--color-signal\) 12%, var\(--color-card\)\)$/);
            expect(answer.get("box-shadow")).toBe("inset 0 0 0 1.5px var(--color-signal)");
        });

        it("should set a hint's candidate notes in cyan and its eliminated notes in red", () => {
            expect(cell(".font-note.text-primary").get("color")).toBe("var(--color-accent)");
            expect(cell('[data-testid^="eliminated-note-"]').get("color")).toBe("var(--color-error)");
        });
    });

    describe("Home", () => {
        it("should drop the logo's filled square and light the diagonal squares in magenta", () => {
            const logo = declarationsOf(CYBER_CSS, skin("logo"));
            const lit = declarationsOf(CYBER_CSS, `${skin("logo")} > * > :nth-child(4n + 1)`);

            expect(logo.get("background-color")).toBe("transparent");
            expect(declarationsOf(CYBER_CSS, `${skin("logo")} > * > *`).get("background-color")).toBe("transparent");
            expect(lit.get("background-color")).toBe("var(--color-primary)");
        });

        it("should mark the logo SYS://SUDOKU in cyan mono", () => {
            const mark = declarationsOf(CYBER_CSS, `${skin("logo")}::after`);

            expect(mark.get("content")).toContain('"SYS://SUDOKU"');
            expect(mark.get("color")).toBe("var(--color-accent)");
            expect(mark.get("font-family")).toBe("var(--cyber-mono)");
        });

        it("should split the title's shadow into magenta and cyan", () => {
            expect(declarationsOf(CYBER_CSS, skin("title")).get("text-shadow")).toBe("2px 0 var(--color-primary), -2px 0 var(--color-accent)");
            expect(declarationsOf(CYBER_CSS, skin("title-glyph")).get("margin-inline")).toBe("0.12em");
        });
    });

    describe("Settings", () => {
        it("should number the group headings 01, 02, … in the mono face", () => {
            const number = declarationsOf(CYBER_CSS, `${skin("group-heading")}::after`);

            expect(number.get("counter-increment")).toBe("cyber-group");
            expect(number.get("content")).toContain("counter(cyber-group, decimal-leading-zero)");
            expect(number.get("font-family")).toBe("var(--cyber-mono)");
            expect(declarationsOf(CYBER_CSS, skin("page")).get("counter-reset")).toBe("cyber-group");
        });

        it("should draw a toggle's mark as a short bar that glows in the primary when on", () => {
            const on = declarationsOf(CYBER_CSS, `${skin("tile")}[aria-pressed="true"] [data-skin~="check"]`);

            expect(declarationsOf(CYBER_CSS, skin("check")).get("background-size")).toBe("100% 6px");
            expect(on.get("--cyber-indicator")).toBe("var(--color-primary)");
            expect(on.get("filter")).toMatch(/^drop-shadow\(.*var\(--color-primary\)\)$/);
        });

        it("should separate a card's rows with dashed edge lines", () => {
            const rows = declarationsOf(CYBER_CSS, `${skin("card")} .divide-y > *`);

            expect(rows.get("border-style")).toBe("dashed");
            expect(rows.get("border-color")).toBe("var(--color-border)");
        });
    });

    describe("motion", () => {
        const CELL = `${skin("board")} [data-variant]`;
        const keyframesOf = (name: string): AtRule => {
            let found: AtRule | undefined;
            postcss.parse(CYBER_CSS).walkAtRules("keyframes", (atRule) => {
                if (atRule.params === name) found = atRule;
            });
            if (found === undefined) throw new Error(`no @keyframes ${name}`);
            return found;
        };
        const propertiesOf = (name: string): Set<string> => {
            const properties = new Set<string>();
            keyframesOf(name).walkDecls((declaration) => {
                properties.add(declaration.prop);
            });
            return properties;
        };
        const outsideReducedMotion = (declaration: Declaration): boolean => {
            const parent = declaration.parent?.parent;
            return !(parent?.type === "atrule" && (parent as AtRule).params.includes("prefers-reduced-motion"));
        };

        it("should glitch a filled digit in over held frames, within the settle time", () => {
            const digit = declarationsOf(CYBER_CSS, `${skin("board")} .value-arrive`).get("animation") ?? "";

            expect(digit).toMatch(/^cyber-glitch \d+ms steps\(/);
            expect(Number.parseInt(digit.split(" ")[1], 10)).toBeLessThanOrEqual(550);
        });

        it("should run a cyan scan line down the cell as a digit arrives, and a magenta one up as it leaves, on the cell's ::before", () => {
            const down = declarationsOf(CYBER_CSS, `${CELL}:has(> .value-arrive)::before`);
            const up = declarationsOf(CYBER_CSS, `${CELL}.value-leave::before`);

            expect(down.get("animation")).toMatch(/^cyber-scan-down \d+ms /);
            expect(up.get("animation")).toMatch(/^cyber-scan-up \d+ms /);
            expect(down.get("background")).toContain("var(--color-accent)");
            expect(up.get("background")).toContain("var(--color-primary)");
            expect(declarationsOf(CYBER_CSS, `${CELL}:is(.value-leave, :has(> .value-arrive))::before`).get("pointer-events")).toBe("none");
        });

        it("should leave the cell's ::after to the selected brackets while a digit arrives or leaves", () => {
            expect(declarationsOf(CYBER_CSS, `${CELL}:is(.value-leave, :has(> .value-arrive))::before`).get("content")).toBe('""');
            expect(allRules().filter(rule => /value-(?:arrive|leave)[^,]*::after/.test(rule.selector))).toEqual([]);
        });

        it("should sweep the beam and scroll the floor with transform and opacity only", () => {
            for (const name of ["cyber-sweep", "cyber-floor", "cyber-scan-down", "cyber-scan-up"]) {
                for (const property of propertiesOf(name)) expect(["transform", "opacity"], `${name} ${property}`).toContain(property);
            }
            const banned = new Set(["top", "left", "right", "bottom", "background-position"]);
            postcss.parse(CYBER_CSS).walkAtRules("keyframes", (atRule) => {
                atRule.walkDecls((declaration) => {
                    expect(banned.has(declaration.prop), `${atRule.params} animates ${declaration.prop}`).toBe(false);
                });
            });
            expect(declarationsOf(CYBER_CSS, `${SCOPE} body::before`).get("animation")).toMatch(/^cyber-sweep \d+s linear infinite$/);
            expect(declarationsOf(CYBER_CSS, `${SCOPE} .app-safe-area::after`).get("animation")).toMatch(/^cyber-floor \d+(?:\.\d+)?s linear infinite$/);
        });

        it("should glitch the Home title now and then", () => {
            expect(declarationsOf(CYBER_CSS, skin("title")).get("animation")).toMatch(/^cyber-title-glitch [\d.]+s steps\(1, end\) infinite$/);
        });

        it("should turn a dashed HUD ring behind the completion card and write MISSION COMPLETE in glowing yellow", () => {
            const ring = declarationsOf(CYBER_CSS, `${skin("celebration")}::before`);
            const text = declarationsOf(CYBER_CSS, `${skin("celebration")}::after`);

            expect(ring.get("border")).toContain("dashed");
            expect(ring.get("animation")).toMatch(/^cyber-spin \d+s linear infinite$/);
            expect(Number(ring.get("z-index"))).toBeLessThan(0);
            expect(propertiesOf("cyber-spin")).toEqual(new Set(["transform"]));
            expect(text.get("content")).toContain("// MISSION COMPLETE");
            expect(text.get("color")).toBe("var(--color-signal)");
            expect(text.get("animation")).toMatch(/^cyber-title-glitch /);
        });

        it("should stop every animation under reduced motion", () => {
            const animated = allDeclarations(/^animation$/).filter(declaration => outsideReducedMotion(declaration) && declaration.value.trim() !== "none");
            const stopped = new Set<string>();
            postcss.parse(CYBER_CSS).walkAtRules("media", (media) => {
                if (!media.params.includes("prefers-reduced-motion")) return;
                media.walkRules((rule) => {
                    if (rule.nodes.some(node => node.type === "decl" && node.prop === "animation" && node.value.trim() === "none")) {
                        for (const selector of rule.selectors) stopped.add(collapse(selector));
                    }
                });
            });

            expect(animated.length).toBeGreaterThan(5);
            for (const declaration of animated) {
                for (const selector of (declaration.parent as Rule).selectors.map(collapse)) expect(stopped, selector).toContain(selector);
            }
        });

        it("should outlast every finite animation with the settle time, the looping ones aside", () => {
            for (const declaration of allDeclarations(/^animation$/)) {
                if (!outsideReducedMotion(declaration) || declaration.value.includes("infinite")) continue;
                const milliseconds = [...declaration.value.matchAll(/(\d+(?:\.\d+)?)(ms|s)\b/g)]
                    .map(([, amount, unit]) => Number(amount) * (unit === "s" ? 1000 : 1));
                for (const duration of milliseconds) expect(duration, declaration.value).toBeLessThan(ARRIVAL_SETTLE_MS);
            }
        });
    });
});
