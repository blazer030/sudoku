import { createInkRenderer } from "@/presentation/components/style-moments/ink/canvas/inkRenderer";
import { DEFAULT_INK_COLOUR, DEFAULT_SEAL_COLOUR } from "@/presentation/components/style-moments/ink/canvas/inkSurface";
import { MAX_BLOOMS, MAX_FILLS, MAX_GROUPS } from "@/presentation/components/style-moments/ink/canvas/inkTimeline";

// A stand-in WebGL context: every call succeeds unless a test says otherwise; jsdom has no WebGL of its own
const fakeContext = (overrides: Record<string, unknown> = {}) => {
    const loseContext = vi.fn();
    const calls: string[] = [];
    // Each uniform's last value, by its name: a uniform's location is its name here
    const uniforms = new Map<string, unknown[]>();
    const context = new Proxy({} as Record<string, unknown>, {
        get: (_, property: string) => {
            if (property in overrides) return overrides[property];
            if (property === "getShaderParameter" || property === "getProgramParameter") return () => true;
            if (property === "getExtension") return () => ({ loseContext });
            if (property === "getUniformLocation") return (_program: unknown, name: string) => name;
            if (/^[A-Z_\d]+$/.test(property)) return 1;
            return (...callArguments: unknown[]) => {
                calls.push(property);
                if (property.startsWith("uniform") && typeof callArguments[0] === "string") uniforms.set(callArguments[0], callArguments.slice(1));
                return {};
            };
        },
    });
    return { context, loseContext, calls, uniforms };
};

const COLOURS = { ink: DEFAULT_INK_COLOUR, seal: DEFAULT_SEAL_COLOUR };

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
        expect(createInkRenderer(canvasWith(null), COLOURS, vi.fn())).toBeNull();
    });

    it("should give no renderer, and let the context go, when its shaders do not compile", () => {
        const { context, loseContext } = fakeContext({ getShaderParameter: () => false });

        expect(createInkRenderer(canvasWith(context), COLOURS, vi.fn())).toBeNull();
        expect(loseContext).toHaveBeenCalled();
    });

    it("should draw a frame by one triangle over the canvas", () => {
        const { context, calls } = fakeContext();
        const renderer = createInkRenderer(canvasWith(context), COLOURS, vi.fn());

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

    it("should draw the fills and the group marks, the boxes' 圓相 in the seal's colour", () => {
        const { context, uniforms } = fakeContext();
        const renderer = createInkRenderer(canvasWith(context), COLOURS, vi.fn());
        const fills = new Float32Array(MAX_FILLS * 4).fill(0.25);
        const groups = new Float32Array(MAX_GROUPS * 4).fill(2);

        renderer?.draw({ blooms: new Float32Array(MAX_BLOOMS * 4), inks: new Float32Array(MAX_BLOOMS), fills, groups, seconds: 0 });

        expect(uniforms.get("u_seal")).toEqual([...DEFAULT_SEAL_COLOUR]);
        expect(uniforms.get("u_fills")).toEqual([fills]);
        expect(uniforms.get("u_groups")).toEqual([groups]);
    });

    // Fills and marks are placed by the cells, which lie inside the board's padding and the grid's border
    it("should place the grid's cells on the canvas, the whole canvas until told", () => {
        const { context, uniforms } = fakeContext();
        const renderer = createInkRenderer(canvasWith(context), COLOURS, vi.fn());
        expect(uniforms.get("u_grid")).toEqual([0, 0, 1, 1]);

        renderer?.placeGrid({ x: 0.04, y: 0.05, width: 0.92, height: 0.9 });

        expect(uniforms.get("u_grid")).toEqual([0.04, 0.05, 0.92, 0.9]);
    });

    it("should tell when the browser takes the context away", () => {
        const { context } = fakeContext();
        const canvas = canvasWith(context);
        const lost = vi.fn();
        createInkRenderer(canvas, COLOURS, lost);

        canvas.dispatchEvent(new Event("webglcontextlost"));

        expect(lost).toHaveBeenCalledTimes(1);
    });

    // Releasing the context itself raises webglcontextlost, which is no loss to report
    it("should release the context when disposed, without reporting it lost", () => {
        const { context, loseContext } = fakeContext();
        const canvas = canvasWith(context);
        const lost = vi.fn();
        const renderer = createInkRenderer(canvas, COLOURS, lost);

        renderer?.dispose();
        canvas.dispatchEvent(new Event("webglcontextlost"));

        expect(loseContext).toHaveBeenCalledTimes(1);
        expect(lost).not.toHaveBeenCalled();
    });
});
