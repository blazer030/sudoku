import { MAX_BLOOMS } from "@/presentation/components/style-moments/ink/canvas/inkTimeline";

// One triangle covering the canvas; the fragment's position is in board fractions, 0–1 from the top left
export const INK_VERTEX_SHADER = `
attribute vec2 a_corner;
varying vec2 v_position;
void main() {
    v_position = vec2(a_corner.x * 0.5 + 0.5, 0.5 - a_corner.y * 0.5);
    gl_Position = vec4(a_corner, 0.0, 1.0);
}`;

// Ink washes on washi. Each bloom's wet front runs out as the square root of time (the timeline gives its radius);
// the front is broken by the paper's noise and fibres, pigment pools where it stops, the body pales as the water
// dries, overlapping washes saturate rather than add, and pigment settles into the paper's tooth. Noise is read
// from the baked texture (red smooth, green fibres, blue tooth, alpha coarse), so mediump draws it cleanly.
export const INK_FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v_position;
uniform sampler2D u_noise;
uniform vec4 u_blooms[${MAX_BLOOMS}];
uniform vec3 u_ink;
uniform float u_aspect;

// Lattice units: red has a cell every 8 texels of 256, so 32 across the texture
float smoothNoise(vec2 point) { return texture2D(u_noise, point / 32.0).r; }

float fractal(vec2 point) {
    float sum = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 4; octave++) {
        sum += amplitude * smoothNoise(point);
        point = point * 2.03 + vec2(1.7, 9.2);
        amplitude *= 0.5;
    }
    return sum / 0.9375;
}

// The paper's tooth: a texel of the blue noise every few pixels, where pigment settles
float tooth(vec2 point) { return texture2D(u_noise, point * 200.0 / 256.0).b; }

// The paper's fibres, which the front catches on: fine noise stretched along two crossing grains, over the tooth
float fibre(vec2 point) {
    float along = texture2D(u_noise, vec2(point.x * 80.0, point.y * 16.0) / 64.0).g;
    float across = texture2D(u_noise, vec2(point.x * 18.0 + 0.37, point.y * 70.0) / 64.0).g;
    return (along + across) * 0.3 + tooth(point) * 0.4;
}

float bloom(vec2 point, vec4 slot) {
    float front = slot.z;
    float progress = slot.w;
    if (progress <= 0.0) return 0.0;
    vec2 centre = vec2(slot.x * u_aspect, slot.y);
    float distanceOut = length((point - centre) * vec2(1.0, 1.08));
    float fibres = fibre(point);
    float edge = distanceOut + (fractal(point * 6.0 + centre * 3.0) - 0.5) * (0.02 + 0.16 * front) + (fibres - 0.5) * 0.025;
    // A soft margin that the fibres feather, rather than a cut edge
    float inside = 1.0 - smoothstep(front - 0.02, front + 0.004, edge);
    // Water carries the pigment out to the front and leaves it there as it stops: a darker rim, a paler heart
    float reach = clamp(distanceOut / max(front, 0.001), 0.0, 1.0);
    float pooled = smoothstep(front - 0.08, front - 0.008, edge) * inside;
    // Past the front, ink creeps a little way along the fibres
    float creep = (1.0 - smoothstep(front, front + 0.035, edge)) * (1.0 - inside) * smoothstep(0.55, 0.85, fibres);
    float mottling = fractal(point * 3.0 + centre) * (0.6 + 0.8 * texture2D(u_noise, point / 3.0 + centre).a);
    float body = (0.2 + 0.12 * reach) * (0.45 + 1.1 * mottling);
    float dried = mix(1.0, 0.5, smoothstep(0.25, 1.0, progress));
    return inside * (body * dried + pooled * 0.34) + creep * 0.15;
}

void main() {
    vec2 point = vec2(v_position.x * u_aspect, v_position.y);
    float ink = 0.0;
    for (int slot = 0; slot < ${MAX_BLOOMS}; slot++) ink += bloom(point, u_blooms[slot]);
    ink = 1.0 - exp(-ink * 1.4);
    ink *= 0.8 + 0.2 * tooth(point * 1.3);
    gl_FragColor = vec4(u_ink * ink, ink);
}`;
