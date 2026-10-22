import { NoopAppearanceBridgeAdapter } from "@/infrastructure/appearanceBridge/NoopAppearanceBridgeAdapter";

describe("NoopAppearanceBridgeAdapter", () => {
    it("should accept the appearance and system bar colours on the web without doing anything", async () => {
        const bridge = new NoopAppearanceBridgeAdapter();

        await expect(bridge.setAppearance("dark")).resolves.toBeUndefined();
        await expect(bridge.setSystemBarColors({ background: "#111110", darkIcons: false })).resolves.toBeUndefined();
    });
});
