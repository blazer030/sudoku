import { readFileSync } from "fs";
import postcss from "postcss";
import { effectScope, nextTick, ref } from "vue";
import { STYLE_IDS } from "@/theme/themeIds";
import { ARRIVAL_SETTLE_MS, useArrivalMotion } from "@/presentation/components/board-cell/useArrivalMotion";

describe("useArrivalMotion", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const startArrival = async () => {
        const scope = effectScope();
        const value = ref(0);
        const motion = scope.run(() => useArrivalMotion(value, ref(false)));
        if (motion === undefined) throw new Error("useArrivalMotion did not run");
        value.value = 5;
        await nextTick();
        return { scope, value, ...motion };
    };

    it("should settle on its own when no animation ends", async () => {
        const { arriving } = await startArrival();
        expect(arriving.value).toBe(true);

        vi.advanceTimersByTime(ARRIVAL_SETTLE_MS);

        expect(arriving.value).toBe(false);
    });

    it("should keep a fresh arrival for its full time after an earlier one", async () => {
        const { arriving, value } = await startArrival();
        vi.advanceTimersByTime(ARRIVAL_SETTLE_MS - 1);
        value.value = 0;
        await nextTick();
        value.value = 7;
        await nextTick();

        vi.advanceTimersByTime(1);

        expect(arriving.value).toBe(true);
    });

    it("should leave no timer behind once its scope ends", async () => {
        const { scope } = await startArrival();

        scope.stop();

        expect(vi.getTimerCount()).toBe(0);
    });

    describe("leaving", () => {
        afterEach(() => {
            vi.unstubAllGlobals();
        });

        const startMotion = (initial: number, popping = false) => {
            const scope = effectScope();
            const value = ref(initial);
            const motion = scope.run(() => useArrivalMotion(value, ref(popping)));
            if (motion === undefined) throw new Error("useArrivalMotion did not run");
            return { scope, value, ...motion };
        };

        it("should flag a cleared digit as leaving until it settles on its own", async () => {
            const { leaving, value } = await startArrival();

            value.value = 0;
            await nextTick();
            expect(leaving.value).toBe(true);

            vi.advanceTimersByTime(ARRIVAL_SETTLE_MS);
            expect(leaving.value).toBe(false);
        });

        it("should flag a digit present on mount as leaving once it is cleared", async () => {
            const { leaving, arriving, value } = startMotion(5);

            value.value = 0;
            await nextTick();

            expect(leaving.value).toBe(true);
            expect(arriving.value).toBe(false);
        });

        it("should stop leaving when its animation settles", async () => {
            const { leaving, settle, value } = startMotion(5);
            value.value = 0;
            await nextTick();

            settle();

            expect(leaving.value).toBe(false);
            expect(vi.getTimerCount()).toBe(0);
        });

        it("should not flag a leaving digit while a hint pops", async () => {
            const { leaving, value } = startMotion(5, true);

            value.value = 0;
            await nextTick();

            expect(leaving.value).toBe(false);
        });

        it("should not flag a leaving digit under reduced motion", async () => {
            vi.stubGlobal("matchMedia", (query: string) => ({ matches: query === "(prefers-reduced-motion: reduce)", media: query }));
            const { leaving, value } = startMotion(5);

            value.value = 0;
            await nextTick();

            expect(leaving.value).toBe(false);
        });

        it("should flag a replaced digit as arriving, not leaving", async () => {
            const { leaving, arriving, value } = startMotion(5);

            value.value = 3;
            await nextTick();

            expect(leaving.value).toBe(false);
            expect(arriving.value).toBe(true);
        });

        it("should not flag a replaced digit while a hint pops", async () => {
            const { arriving, value } = startMotion(5, true);

            value.value = 3;
            await nextTick();

            expect(arriving.value).toBe(false);
        });

        it("should restart the arrival when the digit changes again before it settles", async () => {
            const { arriving, value } = startMotion(5);
            value.value = 3;
            await nextTick();
            vi.advanceTimersByTime(ARRIVAL_SETTLE_MS / 2);

            value.value = 7;
            await nextTick();
            // Dropped for two frames so a style sheet replays its animation
            expect(arriving.value).toBe(false);
            vi.advanceTimersByTime(100);

            expect(arriving.value).toBe(true);
            vi.advanceTimersByTime(ARRIVAL_SETTLE_MS - 100);
            expect(arriving.value).toBe(true);
            vi.advanceTimersByTime(100);
            expect(arriving.value).toBe(false);
        });

        it("should not restart an arrival once its scope ends", async () => {
            const { arriving, scope, value } = startMotion(5);
            value.value = 3;
            await nextTick();
            value.value = 7;
            await nextTick();

            scope.stop();
            vi.advanceTimersByTime(100);

            expect(arriving.value).toBe(false);
            expect(vi.getTimerCount()).toBe(0);
        });

        it("should drop a leave when a digit arrives in the same cell", async () => {
            const { leaving, arriving, value } = startMotion(5);
            value.value = 0;
            await nextTick();

            value.value = 7;
            await nextTick();

            expect(leaving.value).toBe(false);
            expect(arriving.value).toBe(true);
        });
    });

    // A digit's arrival and its leaving both animate through classes only a style sheet styles
    const MOTION_CLASSES = [".value-arrive", ".value-leave"];

    it("should outlast every style's arrival and leaving animation", () => {
        const checked = new Set<string>();
        const layersOf = (value: string): string[] => value.split(/,(?![^(]*\))/).map(layer => layer.replace(/\s+/g, " ").trim());
        for (const style of STYLE_IDS) {
            const sheet = postcss.parse(readFileSync(`src/style/styles/${style}/skin.css`, "utf8"));
            // The layers a style's plain group rule runs on a group's digits
            const groupLayers = new Set<string>();
            sheet.walkDecls("animation", (declaration) => {
                const rule = declaration.parent;
                if (rule?.type !== "rule") return;
                const plainGroupDigit = (rule as postcss.Rule).selectors.some(selector =>
                    /\[data-group\][^ ]* > div$/.test(selector.trim()) && !MOTION_CLASSES.some(motionClass => selector.includes(motionClass)));
                if (plainGroupDigit) layersOf(declaration.value).forEach(layer => groupLayers.add(layer));
            });
            sheet.walkDecls("animation", (declaration) => {
                const rule = declaration.parent;
                if (rule?.type !== "rule" || !MOTION_CLASSES.some(motionClass => (rule as postcss.Rule).selector.includes(motionClass))) return;
                if (declaration.value.trim() === "none") return;
                // A combined rule (the entered digit is in its own completed group) also lists the group's
                // layer; the plain group rule carries the same one, so it runs on once the arrival settles
                const arrivalLayers = layersOf(declaration.value).filter(layer => !groupLayers.has(layer));
                const durations = arrivalLayers.flatMap(layer => [...layer.matchAll(/(\d+(?:\.\d+)?)(ms|s)\b/g)])
                    .map(([, amount, unit]) => Number(amount) * (unit === "s" ? 1000 : 1));
                for (const duration of durations) expect(duration, style).toBeLessThan(ARRIVAL_SETTLE_MS);
                for (const motionClass of MOTION_CLASSES) {
                    if ((rule as postcss.Rule).selector.includes(motionClass)) checked.add(`${style} ${motionClass}`);
                }
            });
        }

        // The styles that animate them, so the check above is not empty
        expect([...checked]).toEqual(expect.arrayContaining(["tactile .value-arrive", "paper .value-leave", "pixel .value-arrive", "pixel .value-leave", "cyber .value-arrive", "cyber .value-leave", "ink .value-arrive", "ink .value-leave", "chalkboard .value-leave", "blueprint .value-leave"]));
    });

    it.each(STYLE_IDS.filter(style => !["paper", "pixel", "cyber", "ink", "chalkboard", "blueprint"].includes(style)))("should leave %s's digits to go without a leaving look", (style) => {
        const selectors: string[] = [];
        postcss.parse(readFileSync(`src/style/styles/${style}/skin.css`, "utf8")).walkRules((rule) => {
            selectors.push(...rule.selectors);
        });

        expect(selectors.filter(selector => selector.includes(".value-leave"))).toEqual([]);
    });
});
