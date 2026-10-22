// subset-font ships no types; this covers the part generate-fonts.ts uses
declare module "subset-font" {
    interface SubsetFontOptions {
        targetFormat?: "sfnt" | "woff" | "woff2" | "truetype";
        variationAxes?: Record<string, number | { min: number; max: number; default?: number }>;
    }

    const subsetFont: (buffer: Buffer, text?: string, options?: SubsetFontOptions) => Promise<Buffer>;
    export default subsetFont;
}
