// Reading aurora's skin for its tests: the sheet itself, a custom property it sets, its keyframes and the vmax
// lengths of its lights' geometry
import { readFileSync } from "fs";
import postcss, { type AtRule, type Rule } from "postcss";
import { declarationsOf } from "../../styleSheetRules";

export const AURORA_CSS = readFileSync("src/style/styles/aurora/skin.css", "utf8");

export const AURORA_SCOPE = '[data-style="aurora"]';
/** 晨光's own values; 夜空's are under AURORA_DARK */
export const AURORA_LIGHT = ':root[data-style="aurora"]';
export const AURORA_DARK = ':root.dark[data-style="aurora"]';

/** The value the skin's top-level rule for `selector` gives the property `name`, whitespace collapsed; "" when unset. */
export const auroraProperty = (selector: string, name: string): string => declarationsOf(AURORA_CSS, selector).get(name) ?? "";

/** The number of a length written in vmax, such as "-16vmax"; throws on any other unit, so the geometry stays in vmax. */
export const vmaxOf = (value: string): number => {
    const match = /^(-?\d*\.?\d+)vmax$/.exec(value.trim());
    if (match === null) throw new Error(`Not a vmax length: "${value}"`);
    return Number(match[1]);
};

/** The keyframes called `name`: each step's selector and its declarations. */
export const keyframesOf = (name: string): { step: string; declarations: Map<string, string> }[] => {
    const steps: { step: string; declarations: Map<string, string> }[] = [];
    postcss.parse(AURORA_CSS).walkAtRules(/keyframes$/, (atRule: AtRule) => {
        if (atRule.params.trim() !== name) return;
        atRule.walkRules((rule: Rule) => {
            const declarations = new Map<string, string>();
            rule.walkDecls((declaration) => {
                declarations.set(declaration.prop, declaration.value.replace(/\s+/g, " ").trim());
            });
            steps.push({ step: rule.selector, declarations });
        });
    });
    return steps;
};
