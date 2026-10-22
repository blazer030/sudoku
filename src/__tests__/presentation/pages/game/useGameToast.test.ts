import { afterEach, describe, expect, it, vi } from "vitest";
import { effectScope } from "vue";
import { useGameToast } from "@/presentation/pages/game/useGameToast";

describe("useGameToast", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("clears its pending timer when the owning scope is disposed", () => {
        vi.useFakeTimers();
        const scope = effectScope();
        const toast = scope.run(() => useGameToast());
        if (toast === undefined) throw new Error("scope did not run");
        toast.show({ kind: "noConflicts" });
        expect(vi.getTimerCount()).toBe(1);

        scope.stop();

        expect(vi.getTimerCount()).toBe(0);
    });
});
