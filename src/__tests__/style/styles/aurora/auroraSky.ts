// Aurora's sky as its skin paints it, for the contrast model. The four lights and the ribbon are composited over the
// page colour in sRGB, in the order the browser paints them, and every value comes from skin.css: each light's size,
// place, fade and drift, the ribbon's band, gradient, feathering mask and swing, and the strengths of the mode and the
// theme. The sky is sampled over a grid of the board and of the page the cards lie on, and at each light's centre and
// between every two, at every drift phase, in the measured windows of auroraWindows.ts (phones, tablets and a
// landscape window), and each point is rounded to 8 bits as the screen shows it.
import postcss from "postcss";
import { declarationsOf, splitTopLevel } from "../../styleSheetRules";
import { AURORA_WINDOWS } from "./auroraWindows";
import { AURORA_CSS, AURORA_DARK, AURORA_LIGHT, AURORA_SCOPE, auroraProperty, keyframesOf, vmaxOf } from "./auroraSheet";
import type { ColorMode } from "@/theme/themeIds";

export type Rgb = readonly [number, number, number];

/** The colours the sky is made of: the page colour, the theme's four lights and its ribbon's two */
export interface AuroraSkyColours {
    background: string;
    lights: readonly [string, string, string, string];
    ribbon: readonly [string, string];
}

/** The distinct grounds the sky lays under the board and under the page's cards */
export interface AuroraSkyGrounds {
    board: readonly Rgb[];
    card: readonly Rgb[];
}

export const rgbOf = (hex: string): Rgb => [1, 3, 5].map(start => Number.parseInt(hex.slice(start, start + 2), 16)) as unknown as Rgb;

/** Paints `top` at `alpha` over an opaque `base`, unrounded */
export const layOver = (top: Rgb, alpha: number, base: Rgb): Rgb => [
    top[0] * alpha + base[0] * (1 - alpha),
    top[1] * alpha + base[1] * (1 - alpha),
    top[2] * alpha + base[2] * (1 - alpha),
];

const LINEAR = Array.from({ length: 256 }, (_, channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
});

const luminanceOf = (colour: Rgb): number =>
    0.2126 * LINEAR[Math.round(colour[0])] + 0.7152 * LINEAR[Math.round(colour[1])] + 0.0722 * LINEAR[Math.round(colour[2])];

/** The WCAG contrast of two colours, each rounded to 8 bits as the screen shows it */
export const contrastOf = (first: Rgb, second: Rgb): number => {
    const firstLuminance = luminanceOf(first);
    const secondLuminance = luminanceOf(second);
    return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
};

const MODE_ROOTS: Readonly<Record<ColorMode, string>> = { light: AURORA_LIGHT, dark: AURORA_DARK };

const fractionOf = (value: string, what: string): number => {
    const match = /^(\d*\.?\d+)(%?)$/.exec(value);
    if (match === null) throw new Error(`aurora's skin sets no number for ${what}: "${value}"`);
    return match[2] === "%" ? Number(match[1]) / 100 : Number(match[1]);
};

/** A number the skin sets for a theme in a mode: the theme's own rule outranks the mode's */
export const auroraNumber = (mode: ColorMode, themeId: string, name: string): number => {
    const themed = auroraProperty(`${MODE_ROOTS[mode]}[data-color-theme="${themeId}"]`, name);
    const value = themed === "" ? auroraProperty(MODE_ROOTS[mode], name) : themed;
    return fractionOf(value, `${name} (${mode}, ${themeId})`);
};

const geometry = (name: string): number => vmaxOf(auroraProperty(AURORA_SCOPE, name));
const shareOf = (name: string): number => fractionOf(auroraProperty(AURORA_SCOPE, name), name);

const expectForm = (value: string | undefined, form: RegExp, what: string): RegExpExecArray => {
    const match = form.exec(value ?? "");
    if (match === null) throw new Error(`aurora's ${what} is not the form the contrast model reads: "${value}"`);
    return match;
};

// A light: a circle of the full colour at its centre fading evenly to nothing at the fade, in a square anchored to two
// of the window's edges
interface Light { index: number; horizontal: "left" | "right"; vertical: "top" | "bottom"; x: number; y: number }
interface LightLayer { lights: Light[]; drift: readonly [number, number] }

const BLOB_IMAGE = /^radial-gradient\(circle, color-mix\(in srgb, var\(--color-aurora-(\d)\) calc\(var\(--aurora-strength\) \* 100%\), transparent\) 0, transparent var\(--aurora-light-fade\)\)$/;
const BLOB_PLACE = /^(left|right) calc\(var\(--aurora-overscan\) \+ var\(--aurora-a(\d)-x\)\) (top|bottom) calc\(var\(--aurora-overscan\) \+ var\(--aurora-a(\d)-y\)\)$/;
const DRIFT = /^translate\(var\((--aurora-drift-\d-x)\), var\((--aurora-drift-\d-y)\)\)$/;

const lightLayerOf = (selector: string): LightLayer => {
    const declarations = declarationsOf(AURORA_CSS, selector);
    expectForm(declarations.get("background-size"), /^var\(--aurora-blob-size\) var\(--aurora-blob-size\)$/, `${selector} size`);
    // The layer is the window grown by the overscan on every side, which the lights' places are measured from
    expectForm(declarations.get("position"), /^fixed$/, `${selector} position`);
    expectForm(declarations.get("inset"), /^calc\(-1 \* var\(--aurora-overscan\)\)$/, `${selector} inset`);
    // Each light carries the strength in its own colour, so the layer itself lays no opacity over them
    if (declarations.has("opacity")) throw new Error(`${selector} sets an opacity the contrast model does not lay`);
    const images = splitTopLevel(declarations.get("background-image") ?? "", /,/);
    const places = splitTopLevel(declarations.get("background-position") ?? "", /,/);
    // The first image is painted on top, so the lights are listed from the bottom up
    const lights = images.map((image, position): Light => {
        const index = Number(expectForm(image, BLOB_IMAGE, `${selector} light`)[1]);
        const [, horizontal, xLight, vertical, yLight] = expectForm(places[position], BLOB_PLACE, `${selector} place`);
        if (Number(xLight) !== index || Number(yLight) !== index) throw new Error(`${selector} places a${index} by another light's offsets`);
        return {
            index,
            horizontal: horizontal as Light["horizontal"],
            vertical: vertical as Light["vertical"],
            x: geometry(`--aurora-a${index}-x`),
            y: geometry(`--aurora-a${index}-y`),
        };
    }).reverse();
    const animation = declarations.get("animation") ?? "";
    const steps = keyframesOf(animation.split(" ")[0]);
    // From where it rests to one end and back, so the phases between them are every place it passes
    if (steps.length !== 1 || steps[0].step !== "to") throw new Error(`${selector} drifts by more than one step`);
    const [, driftX, driftY] = expectForm(steps[steps.length - 1]?.declarations.get("transform"), DRIFT, `${selector} drift`);
    return { lights, drift: [geometry(driftX), geometry(driftY)] };
};

// The ribbon: a band across the top of the window, wider than it, crossed by a gradient of its two colours, feathered
// top and bottom by a mask of a blurred box's profile, and swung about its centre
interface Ribbon {
    overhang: number;
    top: number;
    band: number;
    feather: number;
    angle: number;
    stops: readonly [number, number, number, number];
    shares: readonly [number, number];
    mask: readonly (readonly [alpha: number, at: number])[];
    swing: readonly [number, number];
}

const RIBBON_SELECTOR = `${AURORA_SCOPE} .app-safe-area::before`;
const RIBBON_IMAGE = /^linear-gradient\((\d+)deg, transparent (\d+)%, color-mix\(in srgb, var\(--color-aurora-ribbon-1\) var\(--aurora-ribbon-first\), transparent\) (\d+)%, color-mix\(in srgb, var\(--color-aurora-ribbon-2\) var\(--aurora-ribbon-second\), transparent\) (\d+)%, transparent (\d+)%\)$/;
const MASK_STOP = /^color-mix\(in srgb, var\(--color-foreground\) (\d*\.?\d+)%, transparent\) (\d*\.?\d+)%$/;
const ROTATION = /^rotate\((-?\d*\.?\d+)deg\)$/;

const ribbonOf = (): Ribbon => {
    const declarations = declarationsOf(AURORA_CSS, RIBBON_SELECTOR);
    const left = expectForm(declarations.get("left"), /^-(\d+)%$/, "ribbon's left");
    if (declarations.get("right") !== declarations.get("left")) throw new Error("aurora's ribbon overhangs the window unevenly");
    expectForm(declarations.get("top"), /^calc\(var\(--aurora-ribbon-top\) - var\(--aurora-ribbon-feather\)\)$/, "ribbon's top");
    expectForm(declarations.get("height"), /^calc\(var\(--aurora-ribbon-band\) \+ 2 \* var\(--aurora-ribbon-feather\)\)$/, "ribbon's height");
    expectForm(declarations.get("opacity"), /^var\(--aurora-ribbon-strength\)$/, "ribbon's opacity");
    const [, angle, ...stops] = expectForm(declarations.get("background-image"), RIBBON_IMAGE, "ribbon's gradient").map(Number);
    for (const property of ["mask-image", "-webkit-mask-image"]) {
        expectForm(declarations.get(property), /^var\(--aurora-ribbon-feathering\)$/, `ribbon's ${property}`);
    }
    const maskValue = declarations.get("--aurora-ribbon-feathering") ?? "";
    const maskBody = expectForm(maskValue, /^linear-gradient\(\s*to bottom, (.*?)\s*\)$/, "ribbon's mask")[1];
    const mask = splitTopLevel(maskBody, /,/).map((stop): readonly [number, number] => {
        const [, alpha, at] = expectForm(stop, MASK_STOP, "ribbon's mask stop");
        return [Number(alpha) / 100, Number(at) / 100];
    });
    const swingSteps = keyframesOf((declarations.get("animation") ?? "").split(" ")[0]);
    if (swingSteps.map(step => step.step).join() !== "from,to") throw new Error("aurora's ribbon swings by more than its two ends");
    const swing = swingSteps.map(step => Number(expectForm(step.declarations.get("transform"), ROTATION, "ribbon's swing")[1]));
    return {
        overhang: Number(left[1]) / 100,
        top: shareOf("--aurora-ribbon-top"),
        band: geometry("--aurora-ribbon-band"),
        feather: geometry("--aurora-ribbon-feather"),
        angle,
        stops: stops as unknown as Ribbon["stops"],
        shares: [shareOf("--aurora-ribbon-first"), shareOf("--aurora-ribbon-second")],
        mask,
        swing: [swing[0], swing[swing.length - 1]],
    };
};

// The board is sampled over its cells every 6px, and the page the cards and the header's words lie on every 10px, at
// the coarse phases; at the fine phases, where each light's centre falls (or the nearest point of the area to it)
// and along the line between every two of them, where overlapping cones are brightest
const BOARD_STEP = 6;
const CARD_AREA = { side: 16, top: 0, bottom: 8, step: 10 } as const;
const LINE_POINTS = 24;
// The drift phases: each layer at five points of its path and the ribbon at three of its swing (coarse), or nine and
// five (fine)
const pointsAlong = (count: number): number[] => Array.from({ length: count }, (_, index) => index / (count - 1));
const COARSE = { drift: pointsAlong(5), swing: pointsAlong(3) } as const;
const FINE = { drift: pointsAlong(9), swing: pointsAlong(5) } as const;

const gridOf = (left: number, top: number, right: number, bottom: number, step: number): [number, number][] => {
    const points: [number, number][] = [];
    for (let y = top; y <= bottom; y += step) for (let x = left; x <= right; x += step) points.push([x, y]);
    return points;
};

const maskAt = (mask: Ribbon["mask"], fraction: number): number => {
    if (fraction <= mask[0][1]) return mask[0][0];
    for (let index = 1; index < mask.length; index += 1) {
        const [alpha, at] = mask[index];
        const [previousAlpha, previousAt] = mask[index - 1];
        if (fraction <= at) return previousAlpha + (alpha - previousAlpha) * (fraction - previousAt) / (at - previousAt);
    }
    return mask[mask.length - 1][0];
};

type Painter = (colour: Rgb, x: number, y: number) => Rgb;
type Point = readonly [number, number];

interface LitPainter { centre: Point; paint: Painter }

const lightPainter = (layer: LightLayer, colours: readonly Rgb[], strength: number, width: number, height: number, time: number): LitPainter[] => {
    const vmax = Math.max(width, height) / 100;
    const size = geometry("--aurora-blob-size") * vmax;
    const fade = shareOf("--aurora-light-fade") * size * Math.SQRT2 / 2;
    return layer.lights.map((light) => {
        const left = light.x * vmax + size / 2;
        const top = light.y * vmax + size / 2;
        const centreX = (light.horizontal === "left" ? left : width - left) + layer.drift[0] * vmax * time;
        const centreY = (light.vertical === "top" ? top : height - top) + layer.drift[1] * vmax * time;
        const colour = colours[light.index - 1];
        return {
            centre: [centreX, centreY],
            paint: (base, x, y) => {
                const distance = Math.hypot(x - centreX, y - centreY);
                return distance < fade ? layOver(colour, strength * (1 - distance / fade), base) : base;
            },
        };
    });
};

const ribbonPainter = (ribbon: Ribbon, colours: readonly [Rgb, Rgb], strength: number, width: number, height: number, angle: number): Painter => {
    const vmax = Math.max(width, height) / 100;
    const ribbonWidth = (1 + 2 * ribbon.overhang) * width;
    const ribbonHeight = (ribbon.band + 2 * ribbon.feather) * vmax;
    const centreX = width / 2;
    const centreY = ribbon.top * height - ribbon.feather * vmax + ribbonHeight / 2;
    const direction = [Math.sin(ribbon.angle * Math.PI / 180), -Math.cos(ribbon.angle * Math.PI / 180)];
    const gradientLength = ribbonWidth * Math.abs(direction[0]) + ribbonHeight * Math.abs(direction[1]);
    const [clearBefore, first, second, clearAfter] = ribbon.stops.map(stop => stop / 100);
    const [firstShare, secondShare] = ribbon.shares;
    // The gradient's colour and cover at a point along it, mixed premultiplied as CSS does
    const inkAt = (fraction: number): readonly [Rgb, number] => {
        if (fraction <= clearBefore || fraction >= clearAfter) return [colours[0], 0];
        if (fraction <= first) return [colours[0], firstShare * (fraction - clearBefore) / (first - clearBefore)];
        if (fraction >= second) return [colours[1], secondShare * (clearAfter - fraction) / (clearAfter - second)];
        const share = (fraction - first) / (second - first);
        const firstCover = firstShare * (1 - share);
        const secondCover = secondShare * share;
        const cover = firstCover + secondCover;
        const ink = [0, 1, 2].map(channel => (colours[0][channel] * firstCover + colours[1][channel] * secondCover) / cover) as unknown as Rgb;
        return [ink, cover];
    };
    const radians = angle * Math.PI / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    return (base, x, y) => {
        const relativeX = x - centreX;
        const relativeY = y - centreY;
        const localX = cosine * relativeX + sine * relativeY;
        const localY = -sine * relativeX + cosine * relativeY;
        if (Math.abs(localX) >= ribbonWidth / 2 || Math.abs(localY) >= ribbonHeight / 2) return base;
        const [ink, cover] = inkAt(0.5 + (localX * direction[0] + localY * direction[1]) / gradientLength);
        const masked = cover * maskAt(ribbon.mask, 0.5 + localY / ribbonHeight) * strength;
        return masked > 0 ? layOver(ink, masked, base) : base;
    };
};

// The model reads the sky's numbers from top-level rules only, so none may be set again inside a media query
const AT_RULE_SKY = /^--aurora-(?:strength|ribbon-|light-fade|blob-size|a\d-|drift-|overscan|glass-)/;
const assertSkyUnconditional = (): void => {
    const hits: string[] = [];
    postcss.parse(AURORA_CSS).walkDecls((declaration) => {
        if (AT_RULE_SKY.test(declaration.prop) && declaration.parent?.parent?.type === "atrule") hits.push(declaration.prop);
    });
    if (hits.length > 0) throw new Error(`aurora's skin sets its sky's numbers inside an at-rule: ${hits.join(", ")}`);
};

const keyOf = (colour: Rgb): number => (colour[0] << 16) | (colour[1] << 8) | colour[2];

/**
 * Every distinct ground the sky lays under the board and the cards for one theme in one mode. The layers paint in
 * the page's order: the first light layer (body::before), the ribbon (.app-safe-area::before, inside the body), then
 * the second light layer (body::after), all three at z-index -1 in the root stacking context.
 */
export const auroraSkyGrounds = (mode: ColorMode, themeId: string, colours: AuroraSkyColours): AuroraSkyGrounds => {
    const background = rgbOf(colours.background);
    const lights = colours.lights.map(rgbOf);
    const ribbonColours = [rgbOf(colours.ribbon[0]), rgbOf(colours.ribbon[1])] as const;
    const strength = auroraNumber(mode, themeId, "--aurora-strength");
    const ribbonStrength = auroraNumber(mode, themeId, "--aurora-ribbon-strength");
    assertSkyUnconditional();
    const firstLayer = lightLayerOf(`${AURORA_SCOPE} body::before`);
    const secondLayer = lightLayerOf(`${AURORA_SCOPE} body::after`);
    const ribbon = ribbonOf();
    const board = new Map<number, Rgb>();
    const card = new Map<number, Rgb>();
    const sample = (grounds: Map<number, Rgb>, painters: readonly Painter[], points: readonly Point[]): void => {
        for (const [x, y] of points) {
            let colour: Rgb = background;
            for (const paint of painters) colour = paint(colour, x, y);
            const rounded = colour.map(Math.round) as unknown as Rgb;
            grounds.set(keyOf(rounded), rounded);
        }
    };
    const phasesOf = (points: typeof COARSE | typeof FINE) => points.drift.flatMap(firstTime => points.drift.flatMap(secondTime =>
        points.swing.map(share => [firstTime, secondTime, ribbon.swing[0] + (ribbon.swing[1] - ribbon.swing[0]) * share] as const)));
    for (const { width, height, board: [left, top, right, bottom] } of AURORA_WINDOWS) {
        const areas: readonly (readonly [Map<number, Rgb>, readonly [number, number, number, number], number])[] = [
            [board, [left, top, right, bottom], BOARD_STEP],
            [card, [CARD_AREA.side, CARD_AREA.top, width - CARD_AREA.side, height - CARD_AREA.bottom], CARD_AREA.step],
        ];
        const paintersAt = (firstTime: number, secondTime: number, angle: number) => {
            const first = lightPainter(firstLayer, lights, strength, width, height, firstTime);
            const second = lightPainter(secondLayer, lights, strength, width, height, secondTime);
            const painters = [...first.map(lit => lit.paint), ribbonPainter(ribbon, ribbonColours, ribbonStrength, width, height, angle), ...second.map(lit => lit.paint)];
            return { painters, centres: [...first, ...second].map(lit => lit.centre) };
        };
        for (const [firstTime, secondTime, angle] of phasesOf(COARSE)) {
            const { painters } = paintersAt(firstTime, secondTime, angle);
            for (const [grounds, area, step] of areas) sample(grounds, painters, gridOf(...area, step));
        }
        for (const [firstTime, secondTime, angle] of phasesOf(FINE)) {
            const { painters, centres } = paintersAt(firstTime, secondTime, angle);
            for (const [grounds, [areaLeft, areaTop, areaRight, areaBottom]] of areas) {
                const inside = centres.map(([x, y]): Point => [Math.min(areaRight, Math.max(areaLeft, x)), Math.min(areaBottom, Math.max(areaTop, y))]);
                const lines = inside.flatMap((from, index) => inside.slice(index + 1).flatMap(to => pointsAlong(LINE_POINTS).map((share): Point =>
                    [from[0] + (to[0] - from[0]) * share, from[1] + (to[1] - from[1]) * share])));
                sample(grounds, painters, lines);
            }
        }
    }
    return { board: [...board.values()], card: [...card.values()] };
};
