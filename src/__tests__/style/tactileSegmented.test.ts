import { readFileSync } from "fs";
import postcss from "postcss";

// The transition a style sheet gives the segmented control's sliding indicator
const indicatorTransition = (style: string): string | undefined => {
    let transition: string | undefined;
    postcss.parse(readFileSync(`src/style/styles/${style}.css`, "utf8")).walkRules((rule) => {
        const inReducedMotion = rule.parent?.type === "atrule";
        if (inReducedMotion || !rule.selector.endsWith(".segmented-indicator-motion")) return;
        rule.walkDecls("transition", (declaration) => {
            transition = declaration.value;
        });
    });
    return transition;
};

describe("tactile segmented control", () => {
    it("should slide its indicator as gently as minimal's, without a large overshoot", () => {
        // A spring of cubic-bezier(0.2, 2.2, 0.4, 1) over 320ms flung the indicator past its option
        expect(indicatorTransition("tactile")).toBe(indicatorTransition("minimal"));
    });
});
