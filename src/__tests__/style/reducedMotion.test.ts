import { readFileSync } from "fs";

const REDUCED_MOTION_QUERY = "@media (prefers-reduced-motion: reduce)";

// Returns the bodies of every reduced-motion block in the stylesheet, matching braces
const reducedMotionBlocks = (css: string): string[] => {
    const blocks: string[] = [];
    let searchFrom = 0;
    for (;;) {
        const start = css.indexOf(REDUCED_MOTION_QUERY, searchFrom);
        if (start === -1) return blocks;
        const open = css.indexOf("{", start);
        let depth = 1;
        let position = open + 1;
        while (depth > 0) {
            if (css[position] === "{") depth += 1;
            if (css[position] === "}") depth -= 1;
            position += 1;
        }
        blocks.push(css.slice(open + 1, position - 1));
        searchFrom = position;
    }
};

describe("reduced motion", () => {
    const css = readFileSync("src/style/index.css", "utf8");
    const minimalCss = readFileSync("src/style/styles/minimal/skin.css", "utf8");

    it("should keep every reduced-motion rule in one block", () => {
        expect(reducedMotionBlocks(css)).toHaveLength(1);
        expect(reducedMotionBlocks(minimalCss)).toHaveLength(1);
    });

    it("should drop the movement from enter and leave transitions, keeping the fades", () => {
        const [block] = reducedMotionBlocks(css);

        expect(block).toContain('[class*="-enter-from"]');
        expect(block).toContain('[class*="-leave-to"]');
        expect(block).toContain('[class*="-enter-from"] > *');
        expect(block).toContain('[class*="-leave-to"] > *');
        expect(block).toContain("transform: none !important");
    });

    it("should stop the hint reveal pop, press motion and sliding indicator", () => {
        const [block] = reducedMotionBlocks(css);
        const [minimalBlock] = reducedMotionBlocks(minimalCss);

        expect(block).toContain(".animate-hint-reveal-pop");
        expect(minimalBlock).toContain("[data-press-bounce]");
        expect(minimalBlock).toContain(".segmented-indicator-motion");
    });
});
