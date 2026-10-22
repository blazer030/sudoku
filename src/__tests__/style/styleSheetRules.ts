// Static checks over the per-style stylesheets (src/style/styles/<id>/skin.css). A style may change
// material, shape, thickness, shadow, texture, type and motion, never layout; it stays inside its
// own [data-style] scope; and every movement it adds stops under reduced motion.
import postcss, { type AtRule, type ChildNode, type Declaration, type Node, type Rule } from "postcss";
import type { StyleId } from "@/application/SettingsStorage";

const REDUCED_MOTION_PARAMS = "(prefers-reduced-motion: reduce)";

const LAYOUT_PROPERTIES = new Set([
    "width", "height", "block-size", "inline-size", "gap", "row-gap", "column-gap",
    "top", "right", "bottom", "left", "display", "order", "aspect-ratio", "zoom",
    "border", "border-top", "border-right", "border-bottom", "border-left",
    "border-block", "border-block-start", "border-block-end", "border-inline", "border-inline-start", "border-inline-end",
    "border-width", "font", "font-size", "line-height", "letter-spacing", "word-spacing", "white-space",
]);
const LAYOUT_PREFIXES = ["min-", "max-", "padding", "margin", "inset", "flex", "grid"];

// The title plates are inline-block with a little space between them; nothing else may be set
const TITLE_GLYPH_ALLOWED: Readonly<Record<string, string>> = { "display": "inline-block", "margin-inline": "0.12em" };

const isLayoutProperty = (property: string): boolean =>
    LAYOUT_PROPERTIES.has(property)
    || /^border-(?:[a-z]+-)*width$/.test(property)
    || LAYOUT_PREFIXES.some(prefix => property.startsWith(prefix));

const selectorsOf = (rule: Rule): string[] => rule.selectors.map(selector => selector.replace(/\s+/g, " ").trim());

const ancestorAtRules = (node: ChildNode): AtRule[] => {
    const atRules: AtRule[] = [];
    let current: Node | undefined = node.parent;
    while (current !== undefined) {
        if (current.type === "atrule") atRules.push(current as AtRule);
        current = current.parent;
    }
    return atRules;
};

const isInKeyframes = (node: ChildNode): boolean => ancestorAtRules(node).some(atRule => atRule.name.endsWith("keyframes"));

const isInReducedMotion = (node: ChildNode): boolean =>
    ancestorAtRules(node).some(atRule => atRule.name === "media" && atRule.params.includes(REDUCED_MOTION_PARAMS));

const ownDeclarations = (rule: Rule): Declaration[] => rule.nodes.filter((node): node is Declaration => node.type === "decl");

/** "selector → property" for every declaration that could move or resize the layout. */
export const findLayoutDeclarations = (css: string): string[] => {
    const hits: string[] = [];
    postcss.parse(css).walkRules((rule) => {
        const selectors = selectorsOf(rule);
        // Absolutely placed decorations do not take part in layout
        if (selectors.every(selector => /::(?:before|after)$/.test(selector))) return;
        const isTitleGlyph = selectors.every(selector => selector.endsWith('[data-skin~="title-glyph"]'));
        for (const declaration of ownDeclarations(rule)) {
            const property = declaration.prop.toLowerCase();
            if (property.startsWith("--")) continue;
            if (isTitleGlyph && TITLE_GLYPH_ALLOWED[property] === declaration.value.trim()) continue;
            const layout = property === "position" ? declaration.value.trim() !== "relative" : isLayoutProperty(property);
            if (layout) hits.push(`${selectors.join(", ")} → ${property}`);
        }
    });
    return hits;
};

/** Selectors and keyframes that are not scoped to the style. */
export const findUnscopedSelectors = (css: string, style: StyleId): string[] => {
    const scopes = [`[data-style="${style}"]`, `:root[data-style="${style}"]`, `:root.dark[data-style="${style}"]`];
    const hits: string[] = [];
    const root = postcss.parse(css);
    root.walkAtRules(/keyframes$/, (atRule) => {
        if (!atRule.params.trim().startsWith(`${style}-`)) hits.push(`@keyframes ${atRule.params}`);
    });
    root.walkRules((rule) => {
        if (isInKeyframes(rule)) return;
        for (const selector of selectorsOf(rule)) {
            if (!scopes.some(scope => selector === scope || selector.startsWith(`${scope} `) || selector.startsWith(`${scope}:`)
                || selector.startsWith(`${scope}[`) || selector.startsWith(`${scope}.`))) {
                hits.push(selector);
            }
        }
    });
    return hits;
};

const MOVING_TRANSITION = /\b(?:transform|translate|scale|rotate|all)\b/;

const movementOf = (declaration: Declaration): "animation" | "transition" | null => {
    const property = declaration.prop.toLowerCase();
    const value = declaration.value.trim().toLowerCase();
    if ((property === "animation" || property === "animation-name") && value !== "none") return "animation";
    if ((property === "transition" || property === "transition-property") && MOVING_TRANSITION.test(value)) return "transition";
    return null;
};

const stopsMovement = (declaration: Declaration, movement: "animation" | "transition"): boolean => {
    const property = declaration.prop.toLowerCase();
    const value = declaration.value.trim().toLowerCase();
    if (movement === "animation") return (property === "animation" || property === "animation-name") && value === "none";
    return (property === "transition" && value === "none") || (property === "transform" && value === "none");
};

/** "selector → animation|transition" for every moving rule the reduced-motion block does not stop. */
export const findUnguardedMotion = (css: string): string[] => {
    const root = postcss.parse(css);
    const stopped = new Map<string, Set<string>>();
    root.walkRules((rule) => {
        if (!isInReducedMotion(rule)) return;
        for (const selector of selectorsOf(rule)) {
            const kinds = stopped.get(selector) ?? new Set<string>();
            for (const declaration of ownDeclarations(rule)) {
                if (stopsMovement(declaration, "animation")) kinds.add("animation");
                if (stopsMovement(declaration, "transition")) kinds.add("transition");
            }
            stopped.set(selector, kinds);
        }
    });
    const hits: string[] = [];
    root.walkRules((rule) => {
        if (isInReducedMotion(rule) || isInKeyframes(rule)) return;
        for (const declaration of ownDeclarations(rule)) {
            const movement = movementOf(declaration);
            if (movement === null) continue;
            for (const selector of selectorsOf(rule)) {
                if (stopped.get(selector)?.has(movement) !== true) hits.push(`${selector} → ${movement}`);
            }
        }
    });
    return hits;
};

/** "selector → --name: value" for every type scale outside [1, 1.5]. */
export const findScalesOutOfRange = (css: string): string[] => {
    const hits: string[] = [];
    postcss.parse(css).walkDecls(/^--[\w-]*-scale$/, (declaration) => {
        const scale = Number(declaration.value.trim());
        if (!(scale >= 1 && scale <= 1.5)) {
            const selector = declaration.parent?.type === "rule" ? (declaration.parent as Rule).selector : "";
            hits.push(`${selector} → ${declaration.prop}: ${declaration.value}`);
        }
    });
    return hits;
};
