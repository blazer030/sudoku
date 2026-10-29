import { readFileSync } from "fs";
import postcss from "postcss";
import { ARRIVAL_SETTLE_MS } from "@/presentation/components/board-cell/useArrivalMotion";
import { animationTimingOf, declarationsOf, reducedMotionDeclarationsOf } from "../../styleSheetRules";

const BLUEPRINT_CSS = readFileSync("src/style/styles/blueprint/skin.css", "utf8");

const SCOPE = '[data-style="blueprint"]';
const BOARD = `${SCOPE} [data-skin~="board"]`;

const collapse = (text: string): string => text.replace(/\s+/g, " ").trim();

// Each frame of a @keyframes block, by its collapsed selector
const framesOf = (name: string): Map<string, Map<string, string>> => {
    const frames = new Map<string, Map<string, string>>();
    postcss.parse(BLUEPRINT_CSS).walkAtRules("keyframes", (atRule) => {
        if (atRule.params !== name) return;
        atRule.walkRules((frame) => {
            const declarations = new Map<string, string>();
            frame.walkDecls((declaration) => {
                declarations.set(declaration.prop, collapse(declaration.value));
            });
            frames.set(collapse(frame.selector), declarations);
        });
    });
    return frames;
};

describe("blueprint moments", () => {
    describe("erase strike", () => {
        const STRIKE = `${BOARD} [data-variant].value-leave::before`;
        // One 2px diagonal of the primary across the cell
        const diagonal = (angle: string): string =>
            `linear-gradient(${angle}, transparent calc(50% - 1px), var(--color-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px))`;

        it("should draw the erased digit in the player's hand and ink, untouchable, unseen without its animation", () => {
            const strike = declarationsOf(BLUEPRINT_CSS, STRIKE);
            const entered = declarationsOf(BLUEPRINT_CSS, `${BOARD} [data-value-kind] > div`);

            expect(strike.get("content")).toBe('attr(data-leaving-value) / ""');
            expect(strike.get("font-family")).toBe("var(--font-entry)");
            expect(strike.get("font-size")).toBe("calc(22px * var(--entry-scale, 1))");
            expect(strike.get("color")).toBe(entered.get("color"));
            expect(strike.get("pointer-events")).toBe("none");
            expect(strike.get("opacity")).toBe("0");
        });

        it("should cross it out in two 2px diagonals of the primary on the same pseudo-element", () => {
            const strike = declarationsOf(BLUEPRINT_CSS, STRIKE);

            expect(strike.get("background-image")).toBe(`${diagonal("45deg")}, ${diagonal("-45deg")}`);
        });

        // The cell's ::after carries the selection frame, so it stays while the digit is struck out
        it("should lie below the drafted lines and the selection frame", () => {
            expect(declarationsOf(BLUEPRINT_CSS, STRIKE).get("z-index")).toBe("2");
            expect(declarationsOf(BLUEPRINT_CSS, `${SCOPE} [data-skin~="board-grid"]::after`).get("z-index")).toBe("3");
            expect(declarationsOf(BLUEPRINT_CSS, `${BOARD}:not([data-hint-mode]) [data-selected]::after`).get("z-index")).toBe("4");
        });

        it("should hold still for the first 60%, then fade to nothing, with no filter or ghost", () => {
            const frames = framesOf("blueprint-strike");

            expect(frames.get("0%, 60%")?.get("opacity")).toBe("1");
            expect(frames.get("100%")?.get("opacity")).toBe("0");
            expect([...frames.values()].some(frame => frame.has("filter") || frame.has("transform"))).toBe(false);
            expect(declarationsOf(BLUEPRINT_CSS, STRIKE).has("filter")).toBe(false);
        });

        it("should run 700ms ease-in, end before the cell settles on its own, and never stay on the board", () => {
            const animation = declarationsOf(BLUEPRINT_CSS, STRIKE).get("animation") ?? "";
            const timing = animationTimingOf(animation, "blueprint-strike");

            expect(timing?.durationMs).toBe(700);
            expect(animation).toContain("ease-in");
            expect((timing?.durationMs ?? 0) + (timing?.fixedDelayMs ?? 0)).toBeLessThan(ARRIVAL_SETTLE_MS);
            expect(animation).not.toMatch(/forwards|both/);
        });

        it("should stop under reduced motion, leaving nothing seen", () => {
            expect(reducedMotionDeclarationsOf(BLUEPRINT_CSS, STRIKE).get("animation")).toBe("none");
            expect(declarationsOf(BLUEPRINT_CSS, STRIKE).get("opacity")).toBe("0");
        });
    });
});
