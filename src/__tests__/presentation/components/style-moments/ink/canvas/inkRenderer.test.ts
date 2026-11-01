import { afterEach, describe, expect, it, vi } from "vitest";
import { createInkRenderer } from "@/presentation/components/style-moments/ink/canvas/inkRenderer";
import { DEFAULT_INK_COLOUR } from "@/presentation/components/style-moments/ink/canvas/inkSurface";
import { MAX_BLOOMS, MAX_FILLS, MAX_GROUPS } from "@/presentation/components/style-moments/ink/canvas/inkTimeline";

// A stand-in WebGL context: every call succeeds unless a test says otherwise; jsdom has no WebGL of its own
const fakeContext = (overrides: Record<string, unknown> = {}) => {
    const loseContext = vi.fn();
    const calls: string[] = [];
    const context = new Proxy({} as Record<string, unknown>, {
        get: (_, property: string) => {
            if (property in overrides) return overrides[property];
            if (property === "getShaderParameter" || property === "getProgramParameter") return () => true;
            if (property === "getExtension") return () => ({ loseContext });
            if (/^[A-Z_\d]+$/.test(property)) return 1;
            return (..._arguments: unknown[]) => { calls.push(property); return {}; };
        },
    });
    return { context, loseContext, calls };
};

const canvasWith = (context: unknown): HTMLCanvasElement => {
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockReturnValue(context as RenderingContext);
    return canvas;
};

describe("createInkRenderer", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should give no renderer where the browser has no WebGL", () => {
        expect(createInkRenderer(canvasWith(null), DEFAULT_INK_COLOUR, vi.fn())).toBeNull();
    });

    it("should give no renderer, and let the context go, when its shaders do not compile", () => {
        const { context, loseContext } = fakeContext({ getShaderParameter: () => false });

        expect(createInkRenderer(canvasWith(context), DEFAULT_INK_COLOUR, vi.fn())).toBeNull();
        expect(loseContext).toHaveBeenCalled();
    });

    it("should draw a frame by one triangle over the canvas", () => {
        const { context, calls } = fakeContext();
        const renderer = createInkRenderer(canvasWith(context), DEFAULT_INK_COLOUR, vi.fn());

        renderer?.draw({
            blooms: new Float32Array(MAX_BLOOMS * 4),
            inks: new Float32Array(MAX_BLOOMS),
            fills: new Float32Array(MAX_FILLS * 4),
            groups: new Float32Array(MAX_GROUPS * 4),
            seconds: 0.5,
        });

        expect(renderer).not.toBeNull();
        expect(calls).toContain("uniform4fv");
        expect(calls).toContain("uniform1fv");
        expect(calls).toContain("drawArrays");
    });

    it("should tell when the browser takes the context away", () => {
        const { context } = fakeContext();
        const canvas = canvasWith(context);
        const lost = vi.fn();
        createInkRenderer(canvas, DEFAULT_INK_COLOUR, lost);

        canvas.dispatchEvent(new Event("webglcontextlost"));

        expect(lost).toHaveBeenCalledTimes(1);
    });

    // Releasing the context itself raises webglcontextlost, which is no loss to report
    it("should release the context when disposed, without reporting it lost", () => {
        const { context, loseContext } = fakeContext();
        const canvas = canvasWith(context);
        const lost = vi.fn();
        const renderer = createInkRenderer(canvas, DEFAULT_INK_COLOUR, lost);

        renderer?.dispose();
        canvas.dispatchEvent(new Event("webglcontextlost"));

        expect(loseContext).toHaveBeenCalledTimes(1);
        expect(lost).not.toHaveBeenCalled();
    });
});
