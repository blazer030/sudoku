import { readFileSync } from "fs";
import postcss, { type AtRule, type Node, type Rule } from "postcss";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import { GROUP_RIPPLE_STEP_MS } from "@/presentation/pages/game/useGroupEffect";
import { BOARD_SIZE } from "@/domain/board/constants";
import { animationTimingOf, declarationsOf, reducedMotionDeclarationsOf as reducedMotionDeclarationsIn } from "../../styleSheetRules";

const PIXEL_CSS = readFileSync("src/style/styles/pixel/skin.css", "utf8");

const SCOPE = '[data-style="pixel"]';
const CONSOLE = ':root.dark[data-style="pixel"]';
const FONTS_READY = '[data-style="pixel"][data-pixel-fonts="ready"]';
const BOARD = `${SCOPE} [data-skin~="board"]`;
const GROUP_CELL = `${BOARD} [data-group]:not(.animate-hint-reveal-glow)`;
const SPARK = `${SCOPE} .pixel-group-spark`;
const CELEBRATING_CELL = `${BOARD}:is([data-celebration="playing"], [data-celebration="done"]) [data-variant]`;
const CONSOLE_CELEBRATING_CELL = `${CONSOLE} [data-skin~="board"]:is([data-celebration="playing"], [data-celebration="done"]) [data-variant]`;
const CARD = `${SCOPE} [data-skin~="card"][data-skin~="celebration"]`;
const OPENING_CARD = `${CARD}:not([data-still])`;
const CELEBRATION = `${SCOPE} .pixel-celebration`;
const PLAYING = `${CELEBRATION}:not([data-still])`;
const LOADER_SQUARE = `${SCOPE} .pixel-loader-square`;
const LOADER_DOTS = `${SCOPE} .pixel-loader-dots`;
const LOADER_BAR = `${SCOPE} .pixel-loader-bar-fill`;
const LOADER_CURSOR = `${SCOPE} .pixel-loader-cursor`;

const reducedMotionDeclarationsOf = (selector: string): Map<string, string> => reducedMotionDeclarationsIn(PIXEL_CSS, selector);

const isInside = (rule: Rule, name: string): boolean => {
    let current: Node | undefined = rule.parent;
    while (current !== undefined) {
        if (current.type === "atrule" && (current as AtRule).name === name) return true;
        current = current.parent;
    }
    return false;
};

// Each keyframe's selector and its declarations, in order
const keyframesOf = (name: string): Map<string, Map<string, string>> => {
    const frames = new Map<string, Map<string, string>>();
    postcss.parse(PIXEL_CSS).walkAtRules("keyframes", (atRule) => {
        if (atRule.params.trim() !== name) return;
        atRule.walkRules((frame) => {
            const declarations = new Map<string, string>();
            frame.walkDecls((declaration) => {
                declarations.set(declaration.prop, declaration.value.replace(/\s+/g, " ").trim());
            });
            frames.set(frame.selector.replace(/\s+/g, " ").trim(), declarations);
        });
    });
    return frames;
};

const animationOf = (selector: string): string => declarationsOf(PIXEL_CSS, selector).get("animation") ?? "";

// The cell inverted: the flash's fill, solid, under its ink
const expectLit = (frame: Map<string, string> | undefined): void => {
    expect(frame?.get("background-color")).toBe("var(--pixel-flash-fill)");
    expect(frame?.get("background-image")).toBe("none");
    for (const ink of ["color", "--pixel-clue-ink", "--pixel-entry-ink"]) {
        expect(frame?.get(ink), ink).toBe("var(--pixel-flash-ink)");
    }
};

describe("pixel moments", () => {
    describe("group completion", () => {
        it("should blink a completed group's cells inverted, outward from the entered cell", () => {
            expect(animationOf(GROUP_CELL)).toMatch(/^pixel-group-blink \d+ms steps\(1, jump-start\) calc\(100ms \+ var\(--group-delay, 0ms\)\) 2$/);
        });

        // Lit for the first half of each round, the cell's own look for the second: nothing at 100%, so
        // each round returns to whatever the cell is (its pattern, its selection, its own ink)
        it("should light the cell for half of each of its two rounds and show its own look between them", () => {
            const frames = keyframesOf("pixel-group-blink");

            expect([...frames.keys()]).toEqual(["0%, 50%"]);
            expectLit(frames.get("0%, 50%"));
        });

        it("should keep every colour of the blink in its keyframes, so a cell keeps its own look before and after", () => {
            // A cell carries data-group for the whole effect, from before the ripple reaches it to after its
            // own blink: anything set on the attribute itself would show all that time
            const onTheAttribute: string[] = [];
            postcss.parse(PIXEL_CSS).walkRules((rule: Rule) => {
                if (isInside(rule, "media") || isInside(rule, "keyframes")) return;
                if (!rule.selector.includes("[data-group]")) return;
                rule.walkDecls((declaration) => {
                    if (declaration.prop !== "animation") onTheAttribute.push(`${rule.selector} { ${declaration.prop} }`);
                });
            });

            expect(onTheAttribute).toEqual([]);
        });

        it("should end both blinks within the group effect's own time", () => {
            const timing = animationTimingOf(animationOf(GROUP_CELL), "pixel-group-blink");
            const rounds = Number(/ (\d+)$/.exec(animationOf(GROUP_CELL))?.[1]);

            expect(timing).not.toBeNull();
            expect(rounds).toBe(2);
            expect((timing?.fixedDelayMs ?? 0) + (timing?.durationMs ?? 0) * rounds).toBeLessThanOrEqual(STYLE_MOMENTS.pixel.groupEffectMs);
        });

        it("should ripple at the shared step", () => {
            expect(declarationsOf(PIXEL_CSS, GROUP_CELL).has("--group-ripple-step")).toBe(false);
        });

        it("should invert the cell in 掌機, as the board does", () => {
            const handheld = declarationsOf(PIXEL_CSS, SCOPE);

            expect(handheld.get("--pixel-flash-fill")).toBe("var(--color-foreground)");
            expect(handheld.get("--pixel-flash-ink")).toBe("var(--color-background)");
        });

        // Near-white on black swung too much of the screen too often (photosensitivity): 紅白機 lights the
        // cell in the console blue, which keeps the digit's white ink, so only a dark fill changes
        it("should light the cell in the console blue under its white ink in 紅白機", () => {
            const consoleMode = declarationsOf(PIXEL_CSS, CONSOLE);

            expect(consoleMode.get("--pixel-flash-fill")).toBe("var(--color-highlight)");
            expect(consoleMode.get("--pixel-flash-ink")).toBe("var(--color-foreground)");
        });

        it("should pop pixel sparks at the group's ends as its last cells blink", () => {
            const spark = declarationsOf(PIXEL_CSS, SPARK);

            expect(spark.get("opacity")).toBe("0");
            expect(spark.get("animation")).toMatch(/^pixel-group-spark \d+ms steps\(3, end\) calc\(100ms \+ var\(--pixel-spark-reach\) \* var\(--group-ripple-step, 60ms\)\)$/);
            expect(keyframesOf("pixel-group-spark").get("0%")?.get("box-shadow")).toContain("var(--pixel-spark)");
            expect(declarationsOf(PIXEL_CSS, SCOPE).get("--pixel-spark")).toBe("var(--color-primary)");
        });

        // A group's reach is never past the effect's farthest cell, so the sparks end with the effect
        it("should end the sparks within the group effect's own time after its farthest cell starts", () => {
            const timing = animationTimingOf(animationOf(SPARK), "pixel-group-spark");

            expect((timing?.fixedDelayMs ?? 0) + (timing?.durationMs ?? 0)).toBeLessThanOrEqual(STYLE_MOMENTS.pixel.groupEffectMs);
        });

        it("should stop the blink and the sparks under reduced motion", () => {
            expect(reducedMotionDeclarationsOf(GROUP_CELL).get("animation")).toBe("none");
            expect(reducedMotionDeclarationsOf(SPARK).get("animation")).toBe("none");
        });

        // Owner rule: with motion off a completed group shows nothing at all, so no still look is drawn
        it("should leave a completed group unmarked without motion, with no still-lit look", () => {
            const stillGroupRules: string[] = [];
            postcss.parse(PIXEL_CSS).walkRules((rule: Rule) => {
                if (!isInside(rule, "media")) return;
                if (!rule.selector.includes("[data-group]")) return;
                rule.walkDecls((declaration) => {
                    if (declaration.prop !== "animation") stillGroupRules.push(`${rule.selector} { ${declaration.prop} }`);
                });
            });

            expect(stillGroupRules).toEqual([]);
            expect(keyframesOf("pixel-completion-flash").size).toBe(0);
        });
    });

    describe("celebration", () => {
        it("should clear the board row by row from the top, like a line clear", () => {
            expect(animationOf(CELEBRATING_CELL)).toMatch(/^pixel-row-clear \d+ms steps\(1, end\) calc\(var\(--cell-row\) \* \d+ms\)$/);
        });

        // Two flashes per row at most: lit, dimmed, lit, then back to the cell's own look
        it("should flash each row twice, with the dim shade between", () => {
            const frames = keyframesOf("pixel-row-clear");

            expect([...frames.keys()]).toEqual(["0%", "33.33%", "66.67%, 100%"]);
            expectLit(frames.get("0%"));
            expectLit(frames.get("66.67%, 100%"));
            expect(frames.get("33.33%")?.get("background-color")).toBe("var(--pixel-pattern-shade)");
            expect(frames.get("33.33%")?.get("--pixel-entry-ink")).toBe("var(--color-foreground)");
        });

        // 紅白機 rows are only 80ms apart, so two flashes a row swung any band of rows several times a
        // second: there each row lights once, for the first half of its turn, then shows its own look
        it("should flash each row once in 紅白機", () => {
            const frames = keyframesOf("pixel-row-clear-once");

            expect(animationOf(CONSOLE_CELEBRATING_CELL)).toMatch(/^pixel-row-clear-once \d+ms steps\(1, jump-start\) calc\(var\(--cell-row\) \* 80ms\)$/);
            expect([...frames.keys()]).toEqual(["0%, 50%"]);
            expectLit(frames.get("0%, 50%"));
            expect(reducedMotionDeclarationsOf(CONSOLE_CELEBRATING_CELL).get("animation")).toBe("none");
        });

        it("should start the last row's clear before the dialog opens", () => {
            const delay = /\* (\d+)ms/.exec(animationOf(CELEBRATING_CELL))?.[1];

            expect(Number(delay) * (BOARD_SIZE - 1)).toBeLessThan(STYLE_MOMENTS.pixel.celebrationBoardMs);
        });

        it("should open the window in four steps, held closed only until it starts", () => {
            expect(animationOf(OPENING_CARD)).toMatch(/^pixel-card-open \d+ms steps\(4, end\) \d+ms backwards$/);
            expect(keyframesOf("pixel-card-open").get("0%")?.get("transform")).toBe("scaleY(0)");
            expect(declarationsOf(PIXEL_CSS, CARD).get("box-shadow")).toContain("8px 8px 0 0 var(--pixel-drop)");
        });

        it("should set the trophy solid in the primary and blink it and the new-record tag once open", () => {
            const trophy = declarationsOf(PIXEL_CSS, `${CARD} [data-skin~="trophy"]`);

            expect(trophy.get("background-color")).toBe("var(--color-primary)");
            expect(declarationsOf(PIXEL_CSS, `${CARD} [data-skin~="trophy"] > svg`).get("color")).toBe("var(--color-on-primary)");
            for (const piece of ['[data-skin~="trophy"]', '[data-skin~="new-record"]']) {
                expect(animationOf(`${OPENING_CARD} ${piece}`), piece).toMatch(/^pixel-blink 1000ms steps\(2, jump-none\) \d+ms infinite$/);
            }
        });

        it("should drop STAGE CLEAR letter by letter and pop pixel bursts", () => {
            expect(animationOf(`${PLAYING} .pixel-stage-letter`)).toMatch(/^pixel-stage-drop \d+ms steps\(1, end\) calc\(\d+ms \+ var\(--pixel-letter-step\) \* \d+ms\) both$/);
            expect(keyframesOf("pixel-stage-drop").get("1%")?.get("animation-timing-function")).toBe("steps(4, end)");
            expect(animationOf(`${PLAYING} .pixel-burst`)).toMatch(/^pixel-celebration-burst \d+ms steps\(1, end\) var\(--pixel-burst-delay\) infinite$/);
        });

        // Never more than three flashes a second
        it("should twinkle the stars no faster than three times a second", () => {
            const timing = animationTimingOf(animationOf(`${PLAYING} .pixel-celebration-stars`), "pixel-celebration-twinkle");

            expect(timing?.durationMs ?? 0).toBeGreaterThanOrEqual(1000 / 3);
            expect(declarationsOf(PIXEL_CSS, `${PLAYING} .pixel-celebration-stars`).get("opacity")).toBe("0");
        });

        it("should colour STAGE CLEAR and the bursts from the palette in both modes", () => {
            const handheld = declarationsOf(PIXEL_CSS, SCOPE);
            const consoleMode = declarationsOf(PIXEL_CSS, CONSOLE);

            for (const index of [1, 2, 3, 4]) {
                expect(handheld.get(`--pixel-fx-${index}`), `fx ${index}`).toMatch(/^var\(--color-[\w-]+\)$/);
                expect(consoleMode.get(`--pixel-fx-${index}`), `console fx ${index}`).toMatch(/^var\(--color-[\w-]+\)$/);
            }
            const letters = declarationsOf(PIXEL_CSS, `${SCOPE} .pixel-stage-clear`);
            expect(letters.get("color")).toBe("var(--pixel-stage-clear-ink)");
            expect(letters.get("text-shadow")).toBe("3px 3px 0 var(--pixel-stage-clear-shadow)");
        });

        it("should show STAGE CLEAR and the stars already there when still", () => {
            expect(declarationsOf(PIXEL_CSS, `${SCOPE} .pixel-stage-letter`).has("animation")).toBe(false);
            expect(declarationsOf(PIXEL_CSS, `${SCOPE} .pixel-celebration-stars`).has("animation")).toBe(false);
            expect(declarationsOf(PIXEL_CSS, `${SCOPE} .pixel-celebration-stars`).has("opacity")).toBe(false);
            expect(declarationsOf(PIXEL_CSS, CARD).has("animation")).toBe(false);
        });

        it("should set STAGE CLEAR in Press Start 2P once the pixel faces have loaded", () => {
            expect(declarationsOf(PIXEL_CSS, `${FONTS_READY} :is(.pixel-stage-clear, .pixel-loader-now)`).get("font-family")).toBe("var(--font-pixel-digits)");
        });

        it("should stop every part of it under reduced motion", () => {
            for (const selector of [CELEBRATING_CELL, OPENING_CARD, `${OPENING_CARD} [data-skin~="trophy"]`, `${OPENING_CARD} [data-skin~="new-record"]`,
                `${PLAYING} .pixel-stage-letter`, `${PLAYING} .pixel-burst`, `${PLAYING} .pixel-celebration-stars`]) {
                expect(reducedMotionDeclarationsOf(selector).get("animation"), selector).toBe("none");
            }
        });
    });

    describe("loader", () => {
        it("should light the mark's squares one at a time, snaking down it, on a loop", () => {
            expect(animationOf(LOADER_SQUARE)).toMatch(/^pixel-loader-hop \d+ms steps\(1, end\) calc\(var\(--pixel-loader-step\) \* \d+ms\) infinite$/);
            expect(declarationsOf(PIXEL_CSS, LOADER_SQUARE).get("background-color")).toBe("var(--pixel-loader-unlit)");
        });

        it("should light its squares in the handheld's ink, and in the console's four colours in turn", () => {
            expect(declarationsOf(PIXEL_CSS, `${SCOPE} .pixel-loader`).get("--pixel-loader-lit")).toBe("var(--color-foreground)");
            expect(declarationsOf(PIXEL_CSS, `${SCOPE} .pixel-loader`).get("--pixel-loader-unlit")).toBe("var(--pixel-pattern-shade)");
            expect(declarationsOf(PIXEL_CSS, `${CONSOLE} .pixel-loader-square:nth-child(4n + 1)`).get("--pixel-loader-lit")).toBe("var(--pixel-fx-1)");
            expect(declarationsOf(PIXEL_CSS, `${CONSOLE} .pixel-loader-square:nth-child(4n)`).get("--pixel-loader-lit")).toBe("var(--pixel-fx-4)");
        });

        it("should count NOW LOADING's dots, fill the bar a block at a time and blink the cursor", () => {
            expect(animationOf(LOADER_DOTS)).toMatch(/^pixel-loader-dots \d+ms steps\(4, end\) infinite$/);
            expect(animationOf(LOADER_BAR)).toMatch(/^pixel-loader-fill \d+ms steps\(11, end\) infinite$/);
            expect(animationOf(LOADER_CURSOR)).toMatch(/^pixel-blink 1000ms steps\(2, jump-none\) infinite$/);
        });

        it("should hold a still mark, the dots and a part-filled bar under reduced motion", () => {
            for (const selector of [LOADER_SQUARE, LOADER_DOTS, LOADER_BAR, LOADER_CURSOR]) {
                expect(reducedMotionDeclarationsOf(selector).get("animation"), selector).toBe("none");
            }
            expect(reducedMotionDeclarationsOf(`${LOADER_SQUARE}:nth-child(odd)`).get("background-color")).toBe("var(--pixel-loader-lit)");
            expect(reducedMotionDeclarationsOf(LOADER_DOTS).get("clip-path")).toBe("none");
            expect(reducedMotionDeclarationsOf(LOADER_BAR).get("clip-path")).toBe("inset(0 40% 0 0)");
        });
    });

    it("should keep the moments' timings within a frame of the boards", () => {
        expect(STYLE_MOMENTS.pixel.groupEffectMs).toBe(460);
        expect(STYLE_MOMENTS.pixel.celebrationBoardMs).toBe(800);
        expect(GROUP_RIPPLE_STEP_MS).toBe(60);
    });
});
