import { CapacitorAppearanceBridgeAdapter } from "@/infrastructure/appearanceBridge/CapacitorAppearanceBridgeAdapter";

const { registerPlugin, setAppearance, setSystemBarColors } = vi.hoisted(() => {
    const setAppearance = vi.fn();
    const setSystemBarColors = vi.fn();
    return { setAppearance, setSystemBarColors, registerPlugin: vi.fn(() => ({ setAppearance, setSystemBarColors })) };
});

vi.mock("@capacitor/core", async (importOriginal) => ({
    ...await importOriginal<typeof import("@capacitor/core")>(),
    registerPlugin,
}));

describe("CapacitorAppearanceBridgeAdapter", () => {
    beforeEach(() => {
        setAppearance.mockReset().mockResolvedValue(undefined);
        setSystemBarColors.mockReset().mockResolvedValue(undefined);
        vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should talk to the local AppearanceBridge plugin", () => {
        expect(registerPlugin).toHaveBeenCalledWith("AppearanceBridge");
    });

    it("should hand the appearance setting to the native side", async () => {
        await new CapacitorAppearanceBridgeAdapter().setAppearance("dark");

        expect(setAppearance).toHaveBeenCalledWith({ mode: "dark" });
    });

    it("should hand the system bar colours to the native side", async () => {
        await new CapacitorAppearanceBridgeAdapter().setSystemBarColors({ background: "#F5F4F1", darkIcons: true });

        expect(setSystemBarColors).toHaveBeenCalledWith({ background: "#F5F4F1", darkIcons: true });
    });

    it("should resolve when setting the appearance fails", async () => {
        setAppearance.mockRejectedValue(new Error("not implemented"));

        await expect(new CapacitorAppearanceBridgeAdapter().setAppearance("light")).resolves.toBeUndefined();
        expect(console.error).toHaveBeenCalled();
    });

    it("should resolve when setting the system bar colours fails", async () => {
        setSystemBarColors.mockRejectedValue(new Error("not implemented"));

        await expect(new CapacitorAppearanceBridgeAdapter().setSystemBarColors({ background: "#111110", darkIcons: false }))
            .resolves.toBeUndefined();
        expect(console.error).toHaveBeenCalled();
    });
});
