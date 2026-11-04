// The ink canvas's WebGL1 renderer, loaded only when the ink style plays with motion: one context, one program,
// one baked noise texture and one triangle. It draws a frame from the timeline's frame data and nothing else.
import type { GridPlacement } from "@/presentation/components/style-moments/ink/canvas/inkSurface";
import type { InkFrameRenderer } from "@/presentation/components/style-moments/ink/canvas/inkPlayer";
import { INK_NOISE_SIZE, bakeInkNoise } from "@/presentation/components/style-moments/ink/canvas/inkNoise";
import { INK_FRAGMENT_SHADER, INK_VERTEX_SHADER } from "@/presentation/components/style-moments/ink/canvas/inkShaders";

/** The colours the canvas draws in, each as the shader's 0–1 channels. */
export interface InkColours {
    ink: readonly [number, number, number];
    /** The seal's vermilion, for a box's 圓相. */
    seal: readonly [number, number, number];
}

export interface InkRenderer extends InkFrameRenderer {
    /** Sets the drawing buffer's size in pixels (which wipes it) and keeps the washes round on it. */
    resize: (pixelWidth: number, pixelHeight: number) => void;
    /** Places the grid's cells on the canvas, for the fills and the group marks; the whole canvas until placed. */
    placeGrid: (grid: GridPlacement) => void;
    /** Lets the context go at once, rather than when the page is collected. */
    dispose: () => void;
}

const compile = (context: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
    const shader = context.createShader(type);
    if (shader === null) return null;
    context.shaderSource(shader, source);
    context.compileShader(shader);
    if (context.getShaderParameter(shader, context.COMPILE_STATUS) !== true) {
        context.deleteShader(shader);
        return null;
    }
    return shader;
};

const link = (context: WebGLRenderingContext): WebGLProgram | null => {
    const vertex = compile(context, context.VERTEX_SHADER, INK_VERTEX_SHADER);
    const fragment = compile(context, context.FRAGMENT_SHADER, INK_FRAGMENT_SHADER);
    const program = context.createProgram();
    if (vertex === null || fragment === null) return null;
    context.attachShader(program, vertex);
    context.attachShader(program, fragment);
    context.bindAttribLocation(program, 0, "a_corner");
    context.linkProgram(program);
    if (context.getProgramParameter(program, context.LINK_STATUS) !== true) return null;
    return program;
};

const uploadNoise = (context: WebGLRenderingContext) => {
    context.activeTexture(context.TEXTURE0);
    context.bindTexture(context.TEXTURE_2D, context.createTexture());
    context.texImage2D(context.TEXTURE_2D, 0, context.RGB, INK_NOISE_SIZE, INK_NOISE_SIZE, 0, context.RGB, context.UNSIGNED_BYTE, bakeInkNoise());
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.REPEAT);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.REPEAT);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
};

const uploadTriangle = (context: WebGLRenderingContext) => {
    context.bindBuffer(context.ARRAY_BUFFER, context.createBuffer());
    context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), context.STATIC_DRAW);
    context.enableVertexAttribArray(0);
    context.vertexAttribPointer(0, 2, context.FLOAT, false, 0, 0);
};

/**
 * A renderer on `canvas` drawing in `colours`, or null where WebGL is missing or its shaders fail, so the skin's
 * washes stay. `onLost` is told if the browser takes the context away later.
 */
export const createInkRenderer = (
    canvas: HTMLCanvasElement,
    colours: InkColours,
    onLost: () => void,
): InkRenderer | null => {
    const context = canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
    });
    if (context === null) return null;
    const releaseContext = () => { context.getExtension("WEBGL_lose_context")?.loseContext(); };

    const program = link(context);
    if (program === null) {
        releaseContext();
        return null;
    }
    context.useProgram(program);
    uploadNoise(context);
    uploadTriangle(context);
    context.uniform1i(context.getUniformLocation(program, "u_noise"), 0);
    context.uniform3f(context.getUniformLocation(program, "u_ink"), ...colours.ink);
    context.uniform3f(context.getUniformLocation(program, "u_seal"), ...colours.seal);
    const bloomsLocation = context.getUniformLocation(program, "u_blooms");
    const inksLocation = context.getUniformLocation(program, "u_inks");
    const fillsLocation = context.getUniformLocation(program, "u_fills");
    const groupsLocation = context.getUniformLocation(program, "u_groups");
    const gridLocation = context.getUniformLocation(program, "u_grid");
    context.uniform4f(gridLocation, 0, 0, 1, 1);
    const timeLocation = context.getUniformLocation(program, "u_time");
    const aspectLocation = context.getUniformLocation(program, "u_aspect");
    context.uniform1f(aspectLocation, 1);
    context.clearColor(0, 0, 0, 0);

    const handleLost = () => { onLost(); };
    canvas.addEventListener("webglcontextlost", handleLost);

    return {
        draw: ({ blooms, inks, fills, groups, seconds }) => {
            context.uniform4fv(bloomsLocation, blooms);
            context.uniform1fv(inksLocation, inks);
            context.uniform4fv(fillsLocation, fills);
            context.uniform4fv(groupsLocation, groups);
            context.uniform1f(timeLocation, seconds);
            context.clear(context.COLOR_BUFFER_BIT);
            context.drawArrays(context.TRIANGLES, 0, 3);
        },
        clear: () => {
            context.clear(context.COLOR_BUFFER_BIT);
        },
        resize: (pixelWidth, pixelHeight) => {
            canvas.width = pixelWidth;
            canvas.height = pixelHeight;
            context.viewport(0, 0, pixelWidth, pixelHeight);
            context.uniform1f(aspectLocation, pixelWidth / pixelHeight);
        },
        placeGrid: ({ x, y, width, height }) => {
            context.uniform4f(gridLocation, x, y, width, height);
        },
        dispose: () => {
            canvas.removeEventListener("webglcontextlost", handleLost);
            releaseContext();
        },
    };
};
