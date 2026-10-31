import { MAX_BLOOMS } from "@/presentation/components/style-moments/ink/canvas/inkTimeline";

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
uniform vec3 u_ink;
uniform float u_aspect;
uniform float u_time;

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

void main() {
    float settle = min(u_time / 1.7, 1.0);
    drift = 0.85 * (1.0 - (1.0 - settle) * (1.0 - settle));
    vec2 point = vec2(v_position.x * u_aspect, v_position.y);
    // Slow water: a low, drifting warp carries the whole field, outline and inner density alike
    vec2 carried = point + (water(point * 0.6 + vec2(0.05, -0.035) * drift + 0.31).rg - 0.5) * 0.045;
    float ink = 0.0;
    for (int slot = 0; slot < ${MAX_BLOOMS}; slot++) ink += bloom(carried, u_blooms[slot], u_inks[slot]);
    ink = 1.0 - exp(-ink * 1.5);
    // The wash fades out over the board's last few percent rather than being cut by its edge
    vec2 inBoard = min(v_position, 1.0 - v_position);
    ink *= smoothstep(0.0, 0.035, min(inBoard.x, inBoard.y));
    // The paper's texture at a whisper, and only smooth
    ink *= 0.97 + 0.06 * water(point * 2.3).b;
    gl_FragColor = vec4(u_ink * ink, ink);
}`;
