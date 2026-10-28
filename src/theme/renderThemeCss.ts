// Renders the palettes into src/style/themes.generated.css. Relative imports only.
import { DEFAULT_STYLE_ID, PALETTE_TOKENS, STYLE_OWN_TOKENS, STYLES, getPalette, type Palette } from "./palettes";

const HEADER = "/* Generated from src/theme/palettes.ts by npm run generate:theme-css. Do not edit. */";
const INDENT = "    ";

const renderBlock = (selector: string, palette: Palette): string => {
    // A style's own colours only where its palette sets them
    const tokens = [...PALETTE_TOKENS, ...STYLE_OWN_TOKENS.filter(token => palette[token] !== undefined)];
    const declarations = tokens.map(token => `${INDENT}--color-${token}: ${palette[token]};`);
    return [`${selector} {`, ...declarations, "}"].join("\n");
};

export const renderThemeCss = (): string => {
    const blocks = [renderBlock("@theme static", getPalette(DEFAULT_STYLE_ID, STYLES[DEFAULT_STYLE_ID].themes[0].id, "light"))];
    for (const style of Object.values(STYLES)) {
        for (const theme of style.themes) {
            const attributes = `[data-style="${style.id}"][data-color-theme="${theme.id}"]`;
            if (theme.light !== undefined) blocks.push(renderBlock(`:root${attributes}`, theme.light));
            if (theme.dark !== undefined) blocks.push(renderBlock(`:root.dark${attributes}`, theme.dark));
        }
    }
    return `${HEADER}\n${blocks.join("\n\n")}\n`;
};
