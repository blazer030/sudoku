// Renders the palettes into src/style/themes.generated.css. Relative imports only.
import { DEFAULT_STYLE_ID, PALETTE_TOKENS, STYLES, type Palette } from "./palettes";

const HEADER = "/* Generated from src/theme/palettes.ts by npm run generate:theme-css. Do not edit. */";
const INDENT = "    ";

const renderBlock = (selector: string, palette: Palette): string => {
    const declarations = PALETTE_TOKENS.map(token => `${INDENT}--color-${token}: ${palette[token]};`);
    return [`${selector} {`, ...declarations, "}"].join("\n");
};

export const renderThemeCss = (): string => {
    const defaultPalette = STYLES[DEFAULT_STYLE_ID].themes[0].light;
    const blocks = [renderBlock("@theme static", defaultPalette)];
    for (const style of Object.values(STYLES)) {
        for (const theme of style.themes) {
            const attributes = `[data-style="${style.id}"][data-color-theme="${theme.id}"]`;
            blocks.push(renderBlock(`:root${attributes}`, theme.light));
            blocks.push(renderBlock(`:root.dark${attributes}`, theme.dark));
        }
    }
    return `${HEADER}\n${blocks.join("\n\n")}\n`;
};
