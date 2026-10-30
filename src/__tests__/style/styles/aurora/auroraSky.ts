// Aurora's sky as its skin paints it, for the contrast model. The four lights and the ribbon are composited over the
// page colour in sRGB, in the order the browser paints them, and every value comes from skin.css: each light's size,
// place, fade and drift, the ribbon's band, gradient, feathering mask and swing, and the strengths of the mode and the
// theme. The sky is sampled over a grid of the board and of the page the cards lie on, at every drift phase, in two
// phone windows, and each point is rounded to 8 bits as the screen shows it.
import { declarationsOf, splitTopLevel } from "../../styleSheetRules";
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

/** A number the skin sets for a mode, or for one theme in it, where the theme's own rule outranks the mode's */
export const auroraNumber = (mode: ColorMode, name: string, themeId?: string): number => {
    const themed = themeId === undefined ? "" : auroraProperty(`${MODE_ROOTS[mode]}[data-color-theme="${themeId}"]`, name);
    const value = themed === "" ? auroraProperty(MODE_ROOTS[mode], name) : themed;
    return fractionOf(value, `${name} (${mode}${themeId === undefined ? "" : `, ${themeId}`})`);
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

/** Where the board lies in each phone window the sky is sampled in, measured in the app (left, top, right, bottom) */
export const AURORA_SAMPLE_WINDOWS: readonly { width: number; height: number; board: readonly [number, number, number, number] }[] = [
    { width: 390, height: 844, board: [8, 138, 382, 512] },
    { width: 360, height: 640, board: [26, 68, 335, 377] },
];
// The board is sampled inside its outer cells' glass, every 8px; the cards anywhere below the header, every 10px
const BOARD_INSET = 11;
const BOARD_STEP = 8;
const CARD_AREA = { side: 16, top: 90, bottom: 8, step: 10 } as const;
// The drift phases: each layer at five points of its path, the ribbon at the two ends of its swing and between them
const DRIFT_POINTS = [0, 0.25, 0.5, 0.75, 1] as const;

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

const lightPainter = (layer: LightLayer, colours: readonly Rgb[], strength: number, width: number, height: number, time: number): Painter[] => {
    const vmax = Math.max(width, height) / 100;
    const size = geometry("--aurora-blob-size") * vmax;
    const fade = shareOf("--aurora-light-fade") * size * Math.SQRT2 / 2;
    return layer.lights.map((light) => {
        const left = light.x * vmax + size / 2;
        const top = light.y * vmax + size / 2;
        const centreX = (light.horizontal === "left" ? left : width - left) + layer.drift[0] * vmax * time;
        const centreY = (light.vertical === "top" ? top : height - top) + layer.drift[1] * vmax * time;
        const colour = colours[light.index - 1];
        return (base, x, y) => {
            const distance = Math.hypot(x - centreX, y - centreY);
            return distance < fade ? layOver(colour, strength * (1 - distance / fade), base) : base;
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
    const strength = auroraNumber(mode, "--aurora-strength");
    const ribbonStrength = auroraNumber(mode, "--aurora-ribbon-strength", themeId);
    const firstLayer = lightLayerOf(`${AURORA_SCOPE} body::before`);
    const secondLayer = lightLayerOf(`${AURORA_SCOPE} body::after`);
    const ribbon = ribbonOf();
    const angles = [ribbon.swing[0], (ribbon.swing[0] + ribbon.swing[1]) / 2, ribbon.swing[1]];
    const board = new Map<number, Rgb>();
    const card = new Map<number, Rgb>();
    for (const { width, height, board: [left, top, right, bottom] } of AURORA_SAMPLE_WINDOWS) {
        const areas: [Map<number, Rgb>, [number, number][]][] = [
            [board, gridOf(left + BOARD_INSET, top + BOARD_INSET, right - BOARD_INSET, bottom - BOARD_INSET, BOARD_STEP)],
            [card, gridOf(CARD_AREA.side, CARD_AREA.top, width - CARD_AREA.side, height - CARD_AREA.bottom, CARD_AREA.step)],
        ];
        for (const firstTime of DRIFT_POINTS) for (const secondTime of DRIFT_POINTS) for (const angle of angles) {
            const painters = [
                ...lightPainter(firstLayer, lights, strength, width, height, firstTime),
                ribbonPainter(ribbon, ribbonColours, ribbonStrength, width, height, angle),
                ...lightPainter(secondLayer, lights, strength, width, height, secondTime),
            ];
            for (const [grounds, points] of areas) {
                for (const [x, y] of points) {
                    let colour: Rgb = background;
                    for (const paint of painters) colour = paint(colour, x, y);
                    const rounded = colour.map(Math.round) as unknown as Rgb;
                    grounds.set(keyOf(rounded), rounded);
                }
            }
        }
    }
    return { board: [...board.values()], card: [...card.values()] };
};
