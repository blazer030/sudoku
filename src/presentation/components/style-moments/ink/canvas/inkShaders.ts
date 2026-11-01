import { MAX_BLOOMS, MAX_FILLS, MAX_GROUPS } from "@/presentation/components/style-moments/ink/canvas/inkTimeline";

// One triangle covering the canvas; the fragment's position is in board fractions, 0–1 from the top left
export const INK_VERTEX_SHADER = `
attribute vec2 a_corner;
varying vec2 v_position;
void main() {
    v_position = vec2(a_corner.x * 0.5 + 0.5, 0.5 - a_corner.y * 0.5);
    gl_Position = vec4(a_corner, 0.0, 1.0);
}`;

// Drops of ink spreading in wet washi. Each bloom's front runs out as the square root of time (the timeline gives
// its radius). A drop is densest where it landed: a deep core over a long, gentle tail, so the wash reaches far
// and pales evenly towards a soft edge, with no ring and no band. The core thins slowly as the drop spreads and
// dries. The outline wavers in a few broad lobes, and the whole field rides a slow drift that eases to a stop
// at 1.7s. Overlapping drops saturate rather than add. Noise is read from the baked texture (red and green the
// drift, blue the cloud), so mediump draws it cleanly; it is smooth throughout, so there is no grain.
// The same pass draws a digit's drop and a completed group's mark, placed by the grid's cells (u_grid): a fill
// is a small drop under the digit that soaks a little into its neighbours and fades as the digit settles; a row
// or a column takes a wet brush stroke along it and a box a vermilion 圓相, each blotted where the brush lands
// and thinning as it runs dry. Fills saturate and are capped, so quick fills never stack into blotches.
export const INK_FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v_position;
uniform sampler2D u_noise;
uniform vec4 u_blooms[${MAX_BLOOMS}];
uniform float u_inks[${MAX_BLOOMS}];
uniform vec4 u_fills[${MAX_FILLS}];
uniform vec4 u_groups[${MAX_GROUPS}];
uniform vec4 u_grid;
uniform vec3 u_ink;
uniform vec3 u_seal;
uniform float u_aspect;
uniform float u_time;
const float CELL = 1.0 / 9.0;

// The texture repeats once a board width at a scale of 1
vec3 water(vec2 point) { return texture2D(u_noise, point).rgb; }

// Seconds of drift, easing to a stop at 1.7s so the water comes to rest rather than freezing mid-motion
float drift;

// The distance out from a drop's centre over its front (1 at the front), its outline bent by a broad warp and a
// handful of lobes by angle, which reshape slowly as the front moves and the water drifts
float reach(vec2 point, vec2 centre, float front) {
    vec2 seed = centre * 1.37;
    vec2 warp = water(point * 0.6 + seed + vec2(0.035, -0.025) * drift).rg - 0.5;
    vec2 offset = (point + warp * (0.02 + 0.16 * front) - centre) * vec2(1.0, 1.06);
    float distanceOut = length(offset);
    float turn = atan(offset.y, offset.x) / 6.2832;
    float lobes = water(vec2(turn * 2.0 + seed.x, distanceOut * 0.5 + seed.y + drift * 0.05)).r - 0.5;
    return distanceOut / max(front, 0.001) * (1.0 - lobes * 0.36);
}

float bloom(vec2 point, vec4 slot, float load) {
    float front = slot.z;
    float progress = slot.w;
    if (progress <= 0.0) return 0.0;
    vec2 centre = vec2(slot.x * u_aspect, slot.y);
    float r = reach(point, centre, front);
    float dry = smoothstep(0.45, 1.0, progress);
    // The core holds its density through most of the spread and eases lighter late, and a little as it dries
    float peak = mix(0.68, 0.45, pow(progress, 1.3)) * mix(1.0, 0.92, dry);
    float fromCore = max(r - 0.12, 0.0);
    float tail = exp(-1.4 * fromCore * fromCore);
    float core = exp(-14.0 * fromCore * fromCore);
    float concentration = mix(tail, core, 0.65);
    float edge = 1.0 - smoothstep(0.78, 1.04 + 0.05 * dry, r);
    float cloud = water(point * 0.45 - centre * 0.9 + vec2(0.025, 0.02) * drift).b;
    float body = peak * concentration * edge * (1.0 + 0.25 * (cloud - 0.5));
    // The water's faint tint ahead of the ink fades from inside the ink's own slope and dries away
    float wet = (1.0 - smoothstep(0.75, 1.3, r)) * 0.03 * (1.0 - dry);
    return (body + wet) * load;
}

// A long soft tail under a dense core, by the distance out over the reach (1 at the front)
float concentration(float r, float coreShare) {
    float fromCore = max(r - 0.1, 0.0);
    return mix(exp(-1.6 * fromCore * fromCore), exp(-12.0 * fromCore * fromCore), coreShare);
}

// The distance from a small drop's centre over its front, its outline wavering in a few soft lobes
float dropReach(vec2 point, vec2 centre, float front, float seed, float age) {
    vec2 offset = point - centre;
    vec2 warp = water(point * 1.7 + seed + vec2(0.04, -0.03) * age).rg - 0.5;
    offset += warp * front * 0.5;
    float turn = atan(offset.y, offset.x) / 6.2832;
    float lobes = water(vec2(turn * 2.0 + seed, length(offset) * 2.0 + seed * 0.7 + age * 0.08)).r - 0.5;
    return length(offset) / max(front, 0.0001) * (1.0 - lobes * 0.25);
}

// A digit's drop lands under it, soaks out and fades as the digit settles (900ms).
// Slot: centre x, y in grid fractions; age in seconds (negative: none); seed.
float fill(vec2 point, vec4 slot) {
    float age = slot.z;
    if (age < 0.0 || age > 1.0) return 0.0;
    float t = age / 0.9;
    float front = 0.95 * CELL * (0.3 + 0.7 * sqrt(min(t, 1.0)));
    float r = dropReach(point, slot.xy, front, slot.w, age);
    float edge = 1.0 - smoothstep(0.72, 1.08, r);
    float life = smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.42, 1.0, t));
    return mix(0.8, 0.42, sqrt(min(t, 1.0))) * concentration(r, 0.5) * edge * life;
}

// A wet brush stroke: s runs 0..1 along it, across is the distance from its centre line. Blotted where the
// brush lands, thinning as it runs dry, with a soft wet edge and a slight bleed that widens as it soaks in.
float stroke(float s, float across, float head, float age, float seed, float width, float length) {
    float sc = clamp(s, 0.0, 1.0);
    float pressure = mix(1.0, 0.6, sc);
    float wobble = water(vec2(sc * 0.9 + seed, seed * 0.37 + age * 0.04)).g - 0.5;
    float feather = water(vec2(sc * 4.3 + seed * 1.7, 0.61 + age * 0.05)).b - 0.5;
    float w = width * pressure * (1.0 + 0.45 * wobble + 0.18 * feather);
    // the brush's ends are round: past the head, or before where it landed, the distance is to the nearer end,
    // so the stroke and its bleed fade round the ends just as they do across it, with no seam where it landed
    float pastEnd = (max(s - head, 0.0) + max(-s, 0.0)) * length;
    float a = sqrt(across * across + pastEnd * pastEnd) / w;
    if (a > 6.0) return 0.0;
    float bleed = 0.22 * smoothstep(0.0, 0.7, age);
    float body = (1.0 - smoothstep(0.5, 1.15, a)) + bleed * exp(-a * a * 0.3);
    float load = mix(0.62, 0.2, smoothstep(0.0, 1.0, sc)) + 0.28 * exp(-(sc * sc) / 0.003);
    return body * load;
}

// A row or a column: the stroke runs from just inside the board to past its far edge, bowing a little.
// Slot: kind (0 row, 1 column, 2 box, negative: none); index; age; seed.
float lineStroke(vec2 point, vec4 slot, float strength) {
    float age = slot.z - 0.08;
    if (age < 0.0) return 0.0;
    float head = smoothstep(0.0, 0.44, age) * 1.08;
    float life = 1.0 - smoothstep(0.62, 1.0, age);
    float line = (slot.y + 0.5) * CELL;
    bool row = slot.x < 0.5;
    float along = row ? point.x : point.y;
    float across = row ? point.y - line : point.x - line;
    across -= (water(vec2(along * 0.8 + slot.w, slot.w)).r - 0.5) * 0.25 * CELL;
    float s = (along - 0.03) / 0.99;
    return strength * stroke(s, across, head, age, slot.w, 0.3 * CELL, 0.99) * life;
}

// A box: the 圓相, drawn clockwise from the upper left and left open where it closes
float enso(vec2 point, vec4 slot, float strength) {
    float age = slot.z - 0.16;
    if (age < 0.0) return 0.0;
    float head = smoothstep(0.0, 0.54, age) * 0.94;
    float life = 1.0 - smoothstep(0.66, 1.06, age);
    vec2 centre = (vec2(mod(slot.y, 3.0), floor(slot.y / 3.0)) * 3.0 + 1.5) * CELL;
    vec2 offset = point - centre;
    float s = fract((2.4 - atan(-offset.y, offset.x)) / 6.2832);
    // just before the start counts as before it, so the brush lands round rather than cut
    if (s > 0.97) s -= 1.0;
    float radius = 1.28 * CELL * (1.0 + 0.05 * s) * (1.0 + 0.06 * (water(vec2(s + slot.w, 0.3)).r - 0.5));
    return strength * stroke(s, length(offset) - radius, head, age, slot.w, 0.24 * CELL, 6.2832 * 1.28 * CELL) * life;
}

void main() {
    float settle = min(u_time / 1.7, 1.0);
    drift = 0.85 * (1.0 - (1.0 - settle) * (1.0 - settle));
    vec2 point = vec2(v_position.x * u_aspect, v_position.y);
    // Slow water: a low, drifting warp carries the whole field, outline and inner density alike
    vec2 carried = point + (water(point * 0.6 + vec2(0.05, -0.035) * drift + 0.31).rg - 0.5) * 0.045;
    float wash = 0.0;
    for (int slot = 0; slot < ${MAX_BLOOMS}; slot++) wash += bloom(carried, u_blooms[slot], u_inks[slot]);
    wash = 1.0 - exp(-wash * 1.5);
    // The wash fades out over the board's last few percent rather than being cut by its edge
    vec2 inBoard = min(v_position, 1.0 - v_position);
    wash *= smoothstep(0.0, 0.035, min(inBoard.x, inBoard.y));
    // The paper's texture at a whisper, and only smooth
    wash *= 0.97 + 0.06 * water(point * 2.3).b;

    // The fills and the group marks are placed by the cells, in grid fractions with y down
    vec2 inGrid = (v_position - u_grid.xy) / u_grid.zw;
    float fills = 0.0;
    for (int slot = 0; slot < ${MAX_FILLS}; slot++) fills += fill(inGrid, u_fills[slot]);
    // fills saturate and are capped, so quick fills never stack into blotches
    float fillInk = min(1.0 - exp(-fills * 1.3), 0.36);
    float strokes = 0.0;
    float seal = 0.0;
    for (int slot = 0; slot < ${MAX_GROUPS}; slot++) {
        vec4 group = u_groups[slot];
        if (group.x < -0.5) continue;
        if (group.x > 1.5) seal += enso(inGrid, group, 1.0); else strokes += lineStroke(inGrid, group, 1.0);
    }
    // Ink saturates with ink; the seal's vermilion lies over it
    float inkAlpha = 1.0 - (1.0 - wash) * (1.0 - fillInk) * exp(-strokes * 1.5);
    float sealAlpha = 1.0 - exp(-seal * 1.5);
    float alpha = 1.0 - (1.0 - inkAlpha) * (1.0 - sealAlpha);
    vec3 colour = u_ink * inkAlpha * (1.0 - sealAlpha) + u_seal * sealAlpha;
    gl_FragColor = vec4(colour, alpha);
}`;
