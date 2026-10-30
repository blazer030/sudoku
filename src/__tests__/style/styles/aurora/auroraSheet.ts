// Reading aurora's skin for its tests: the sheet itself, a custom property it sets and the vmax lengths of its
// lights' geometry
import { readFileSync } from "fs";
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
