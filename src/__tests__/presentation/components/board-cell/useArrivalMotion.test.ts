import { readFileSync } from "fs";
import postcss from "postcss";
import { effectScope, nextTick, ref } from "vue";
import { STYLE_IDS } from "@/application/SettingsStorage";
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

    it("should outlast every style's arrival animation", () => {
        for (const style of STYLE_IDS) {
            postcss.parse(readFileSync(`src/style/styles/${style}/skin.css`, "utf8")).walkDecls("animation", (declaration) => {
                const rule = declaration.parent;
                if (rule?.type !== "rule" || !(rule as postcss.Rule).selector.includes(".value-arrive")) return;
                const durations = [...declaration.value.matchAll(/(\d+(?:\.\d+)?)(ms|s)\b/g)]
                    .map(([, amount, unit]) => Number(amount) * (unit === "s" ? 1000 : 1));
                for (const duration of durations) expect(duration, style).toBeLessThan(ARRIVAL_SETTLE_MS);
            });
        }
    });
});
