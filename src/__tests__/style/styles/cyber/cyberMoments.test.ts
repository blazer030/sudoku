import { readFileSync } from "fs";
import postcss from "postcss";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import { GROUP_RIPPLE_STEP_MS } from "@/presentation/pages/game/useGroupEffect";
import { animationTimingOf, declarationsOf, reducedMotionDeclarationsOf as reducedMotionDeclarationsIn } from "../../styleSheetRules";

const CYBER_CSS = readFileSync("src/style/styles/cyber/skin.css", "utf8");

const SCOPE = '[data-style="cyber"]';
const BOARD = `${SCOPE} [data-skin~="board"]`;
const GROUP_CELL = `${BOARD} [data-group]:not(.animate-hint-reveal-glow)`;
const BEAM_FORWARD = `${SCOPE} .cyber-group-beam-forward`;
const BEAM_BACK = `${SCOPE} .cyber-group-beam-back`;
const BEAM_LINE = `${SCOPE} .cyber-group-beam-line`;
const FRAME = `${SCOPE} .cyber-group-frame`;
const TAG = `${SCOPE} .cyber-group-tag`;
const CELEBRATING = `${BOARD}:is([data-celebration="playing"], [data-celebration="done"])`;
const CELEBRATING_CELL = `${CELEBRATING} [data-variant]`;
const SCAN = `${CELEBRATING} > div::after`;
const BRACKETS = `${BOARD}[data-celebration]::after`;
const LOCKING = `${CELEBRATING}::after`;
const CARD = `${SCOPE} [data-skin~="card"][data-skin~="celebration"]`;
const OPENING_CARD = `${CARD}:not([data-still])`;
const TITLE = `${CARD} [data-skin~="complete-title"]`;
const GLITCHING_TITLE = `${OPENING_CARD} [data-skin~="complete-title"]`;
const TROPHY = `${CARD} [data-skin~="trophy"]`;
const CELEBRATION = `${SCOPE} .cyber-celebration`;
const PLAYING = `${CELEBRATION}:not([data-still])`;
const RING = `${SCOPE} .cyber-celebration-ring`;
const MISSION = `${SCOPE} .cyber-mission`;
const LOADER = `${SCOPE} .cyber-loader`;

const reducedMotionDeclarationsOf = (selector: string): Map<string, string> => reducedMotionDeclarationsIn(CYBER_CSS, selector);

const animationOf = (selector: string): string => declarationsOf(CYBER_CSS, selector).get("animation") ?? "";

// Each keyframe's selector and its declarations, in order
const keyframesOf = (name: string): Map<string, Map<string, string>> => {
    const frames = new Map<string, Map<string, string>>();
    postcss.parse(CYBER_CSS).walkAtRules("keyframes", (atRule) => {
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

const propertiesOf = (name: string): Set<string> =>
    new Set([...keyframesOf(name).values()].flatMap(frame => [...frame.keys()]));

const endOf = (selector: string, name: string): number => {
    const timing = animationTimingOf(animationOf(selector), name);
    if (timing === null) throw new Error(`${selector} does not run ${name}`);
    return timing.fixedDelayMs + timing.durationMs;
};

describe("cyber moments", () => {
    describe("group completion", () => {
        it("should light a completed group's cells cyan, outward from the entered cell, at the board's quicker step", () => {
            const cell = declarationsOf(CYBER_CSS, GROUP_CELL);

            expect(cell.get("animation")).toMatch(/^cyber-group-hit \d+ms ease-out calc\(100ms \+ var\(--group-delay, 0ms\)\)$/);
            expect(Number.parseInt(cell.get("--group-ripple-step") ?? "", 10)).toBeLessThanOrEqual(GROUP_RIPPLE_STEP_MS);
        });

        // Only the peak, on the cell's own background: the digit keeps its own glitch when it arrives
        it("should hold only the cyan peak, on the cell, and leave the digit's arrival alone", () => {
            const frames = keyframesOf("cyber-group-hit");

            expect([...frames.keys()]).toEqual(["0%"]);
            expect(frames.get("0%")?.get("background-color")).toBe("color-mix(in srgb, var(--color-accent) 26%, var(--color-card))");
            expect(declarationsOf(CYBER_CSS, `${GROUP_CELL} > div`).get("animation")).toBeUndefined();
        });

        it("should shoot a scan beam both ways from the entered cell, moving by transform only", () => {
            expect(animationOf(BEAM_FORWARD)).toMatch(/^cyber-group-beam-forward \d+ms linear 100ms$/);
            expect(animationOf(BEAM_BACK)).toMatch(/^cyber-group-beam-back \d+ms linear 100ms$/);
            for (const name of ["cyber-group-beam-forward", "cyber-group-beam-back"]) {
                expect(propertiesOf(name)).toEqual(new Set(["opacity", "transform"]));
            }
            expect(declarationsOf(CYBER_CSS, BEAM_LINE).get("background-color")).toBe("var(--color-accent)");
        });

        it("should step a box's outline out from the entered cell, and flash its OK tag", () => {
            expect(animationOf(FRAME)).toMatch(/^cyber-group-box \d+ms steps\(8, end\) 100ms$/);
            expect(propertiesOf("cyber-group-box")).toEqual(new Set(["opacity", "transform"]));
            expect(keyframesOf("cyber-group-box").get("0%")?.get("transform")).toBe("scale(0.3333)");
            expect(animationOf(TAG)).toMatch(/^cyber-group-tag \d+ms steps\(1, end\) \d+ms$/);
            expect(declarationsOf(CYBER_CSS, TAG).get("opacity")).toBe("0");
        });

        it("should tag a box in yellow and a line in cyan, on the page colour", () => {
            expect(declarationsOf(CYBER_CSS, TAG).get("color")).toBe("var(--color-accent)");
            expect(declarationsOf(CYBER_CSS, TAG).get("background-color")).toBe("var(--color-background)");
            expect(declarationsOf(CYBER_CSS, `${TAG}.cyber-group-tag-box`).get("color")).toBe("var(--color-signal)");
        });

        it("should end every piece within the group effect's own time", () => {
            const effectMs = STYLE_MOMENTS.cyber.groupEffectMs;

            expect(endOf(GROUP_CELL, "cyber-group-hit")).toBeLessThanOrEqual(effectMs);
            expect(endOf(BEAM_FORWARD, "cyber-group-beam-forward")).toBeLessThanOrEqual(effectMs);
            expect(endOf(BEAM_BACK, "cyber-group-beam-back")).toBeLessThanOrEqual(effectMs);
            expect(endOf(FRAME, "cyber-group-box")).toBeLessThanOrEqual(effectMs);
            // A box's farthest cell is at least two steps from the entered one, a line's four
            expect(endOf(TAG, "cyber-group-tag")).toBeLessThanOrEqual(effectMs + 2 * GROUP_RIPPLE_STEP_MS);
        });

        it("should stop every group piece under reduced motion", () => {
            for (const selector of [GROUP_CELL, BEAM_FORWARD, BEAM_BACK, FRAME, TAG]) {
                expect(reducedMotionDeclarationsOf(selector).get("animation"), selector).toBe("none");
            }
        });
    });

    describe("celebration", () => {
        it("should light the solved board row by row from the top as the scan passes", () => {
            expect(animationOf(CELEBRATING_CELL)).toMatch(/^cyber-row-light \d+ms ease-out calc\(var\(--cell-row\) \* \d+ms\)$/);
            expect([...keyframesOf("cyber-row-light").keys()]).toEqual(["0%"]);
        });

        it("should scan a cyan beam down the grid on its ::after, by transform, before the dialog opens", () => {
            const scan = declarationsOf(CYBER_CSS, SCAN);

            expect(scan.get("content")).toBe('""');
            expect(scan.get("pointer-events")).toBe("none");
            expect(scan.get("background")).toContain("var(--color-accent)");
            expect(scan.get("animation")).toMatch(/^cyber-board-scan \d+ms linear$/);
            expect(propertiesOf("cyber-board-scan")).toEqual(new Set(["opacity", "transform"]));
            expect(endOf(SCAN, "cyber-board-scan")).toBeLessThanOrEqual(STYLE_MOMENTS.cyber.celebrationBoardMs);
            // Each row lights as the beam reaches it
            const rowStep = Number(/\* (\d+)ms/.exec(animationOf(CELEBRATING_CELL))?.[1]);
            const scanMs = animationTimingOf(scan.get("animation") ?? "", "cyber-board-scan")?.durationMs ?? 0;
            expect(Math.abs(rowStep * 9 - scanMs)).toBeLessThanOrEqual(20);
        });

        it("should lock four yellow brackets onto the board in three steps, and keep them there", () => {
            const brackets = declarationsOf(CYBER_CSS, BRACKETS);

            expect(brackets.get("content")).toBe('""');
            expect(brackets.get("pointer-events")).toBe("none");
            expect((brackets.get("background") ?? "").match(/var\(--color-signal\)/g)?.length).toBeGreaterThanOrEqual(8);
            expect(animationOf(LOCKING)).toMatch(/^cyber-bracket-lock \d+ms steps\(3, end\) \d+ms backwards$/);
            expect(propertiesOf("cyber-bracket-lock")).toEqual(new Set(["opacity", "transform"]));
        });

        it("should open the card like a CRT, from a line across its middle, held closed until it starts", () => {
            expect(animationOf(OPENING_CARD)).toMatch(/^cyber-crt-open \d+ms linear \d+ms backwards$/);
            const frames = keyframesOf("cyber-crt-open");
            expect(frames.get("0%")?.get("clip-path")).toContain("50%");
            expect(propertiesOf("cyber-crt-open")).toEqual(new Set(["clip-path", "opacity"]));
            // The first button is ready about when the board's is (1440ms after the solving entry)
            const opened = STYLE_MOMENTS.cyber.celebrationBoardMs + endOf(OPENING_CARD, "cyber-crt-open");
            expect(opened).toBeGreaterThan(1440 * 0.8);
            expect(opened).toBeLessThan(1440 * 1.2);
        });

        it("should split the title's shadow into magenta and cyan, glitching it in only with motion", () => {
            expect(declarationsOf(CYBER_CSS, TITLE).get("text-shadow")).toBe("2px 0 var(--color-primary), -2px 0 var(--color-accent)");
            expect(declarationsOf(CYBER_CSS, TITLE).get("animation")).toBeUndefined();
            expect(animationOf(GLITCHING_TITLE)).toMatch(/^cyber-glitch \d+ms steps\(1, end\) \d+ms backwards$/);
        });

        it("should set the trophy in yellow on a deep yellow wash with cut corners", () => {
            const trophy = declarationsOf(CYBER_CSS, TROPHY);

            expect(trophy.get("background-color")).toBe("color-mix(in srgb, var(--color-signal) 12%, transparent)");
            expect(trophy.get("clip-path")).toContain("polygon(");
            expect(declarationsOf(CYBER_CSS, `${TROPHY} > svg`).get("color")).toBe("var(--color-signal)");
        });

        it("should turn the HUD ring in behind the dialog and glitch MISSION COMPLETE in, then now and then", () => {
            expect(declarationsOf(CYBER_CSS, RING).get("border-color")).toContain("var(--color-accent)");
            expect(animationOf(`${PLAYING} .cyber-celebration-ring-in`)).toMatch(/^cyber-ring-in \d+ms cubic-bezier\([^)]*\) \d+ms backwards$/);
            expect(animationOf(`${PLAYING} .cyber-celebration-ring`)).toMatch(/^cyber-spin \d+s linear infinite$/);
            const mission = animationOf(`${PLAYING} .cyber-mission`);
            expect(mission).toMatch(/^cyber-glitch \d+ms steps\(1, end\) \d+ms backwards, cyber-title-glitch [\d.]+s steps\(1, end\) \d+ms infinite$/);
            expect(declarationsOf(CYBER_CSS, MISSION).get("color")).toBe("var(--color-signal)");
        });

        it("should draw the ring and MISSION COMPLETE over the scene only, no longer on the card's own pseudo-elements", () => {
            expect(declarationsOf(CYBER_CSS, `${SCOPE} [data-skin~="celebration"]::before`).size).toBe(0);
            expect(declarationsOf(CYBER_CSS, `${SCOPE} [data-skin~="celebration"]::after`).size).toBe(0);
        });

        it("should leave the brackets, ring and text still when still", () => {
            // The brackets' shape is on every celebration state, their lock only while it plays
            expect(declarationsOf(CYBER_CSS, BRACKETS).get("animation")).toBeUndefined();
            expect(declarationsOf(CYBER_CSS, `${CELEBRATION}[data-still] .cyber-mission`).get("animation")).toBeUndefined();
            expect(declarationsOf(CYBER_CSS, RING).get("animation")).toBeUndefined();
            expect(declarationsOf(CYBER_CSS, MISSION).get("animation")).toBeUndefined();
        });

        it("should stop every part of it under reduced motion", () => {
            for (const selector of [
                CELEBRATING_CELL, SCAN, LOCKING, OPENING_CARD, GLITCHING_TITLE,
                `${PLAYING} .cyber-celebration-ring-in`, `${PLAYING} .cyber-celebration-ring`, `${PLAYING} .cyber-mission`,
            ]) {
                expect(reducedMotionDeclarationsOf(selector).get("animation"), selector).toBe("none");
            }
        });
    });

    describe("loader", () => {
        it("should counter-rotate the two rings", () => {
            expect(animationOf(`${LOADER}-orbit`)).toMatch(/^cyber-spin [\d.]+s linear infinite$/);
            expect(animationOf(`${LOADER}-arc`)).toMatch(/^cyber-spin [\d.]+s linear infinite reverse$/);
        });

        it("should light the 3×3's squares magenta at their own beats, in held frames", () => {
            expect(animationOf(`${LOADER}-square`)).toMatch(/^cyber-loader-lit [\d.]+m?s steps\(1, end\) var\(--cyber-loader-delay\) infinite$/);
        });

        it("should type the generator's log a line at a time, by clip only", () => {
            for (const line of [1, 2, 3]) {
                expect(animationOf(`${LOADER}-line:nth-child(${line})`)).toMatch(new RegExp(`^cyber-loader-type-${line} [\\d.]+s linear infinite$`));
                expect(propertiesOf(`cyber-loader-type-${line}`)).toEqual(new Set(["clip-path", "animation-timing-function"]));
            }
        });

        it("should run the bar up, jump it back once and run it on, by transform only", () => {
            expect(animationOf(`${LOADER}-fill`)).toMatch(/^cyber-loader-progress [\d.]+s linear infinite$/);
            expect(propertiesOf("cyber-loader-progress")).toEqual(new Set(["transform"]));
        });

        it("should hold still rings, lit odd squares, the whole log and a part-filled bar under reduced motion", () => {
            for (const part of ["orbit", "arc", "square", "fill"]) {
                expect(reducedMotionDeclarationsOf(`${LOADER}-${part}`).get("animation"), part).toBe("none");
            }
            for (const line of [1, 2, 3]) {
                const still = reducedMotionDeclarationsOf(`${LOADER}-line:nth-child(${line})`);
                expect(still.get("animation")).toBe("none");
                expect(still.get("clip-path")).toBe("none");
            }
            expect(reducedMotionDeclarationsOf(`${LOADER}-square:nth-child(odd)`).get("background-color")).toBe("var(--color-primary)");
            expect(reducedMotionDeclarationsOf(`${LOADER}-fill`).get("transform")).toBe("scaleX(0.64)");
        });
    });

    it("should keep the moments' timings within a frame of the boards", () => {
        expect(STYLE_MOMENTS.cyber.groupEffectMs).toBe(860);
        expect(STYLE_MOMENTS.cyber.celebrationBoardMs).toBe(860);
    });
});
