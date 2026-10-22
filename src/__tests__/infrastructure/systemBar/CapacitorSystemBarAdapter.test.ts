import { SystemBarsStyle } from "@capacitor/core";
import { CapacitorSystemBarAdapter } from "@/infrastructure/systemBar/CapacitorSystemBarAdapter";

const { setStyle } = vi.hoisted(() => ({ setStyle: vi.fn() }));

vi.mock("@capacitor/core", async (importOriginal) => ({
    ...await importOriginal<typeof import("@capacitor/core")>(),
    SystemBars: { setStyle },
}));

describe("CapacitorSystemBarAdapter", () => {
    beforeEach(() => {
        setStyle.mockReset().mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should use light icons in dark mode", async () => {
        await new CapacitorSystemBarAdapter().apply("dark");

        expect(setStyle).toHaveBeenCalledWith({ style: SystemBarsStyle.Dark });
    });

    it("should use dark icons in light mode", async () => {
        await new CapacitorSystemBarAdapter().apply("light");

        expect(setStyle).toHaveBeenCalledWith({ style: SystemBarsStyle.Light });
    });

    it("should resolve when the plugin rejects", async () => {
        setStyle.mockRejectedValue(new Error("not implemented"));
        vi.spyOn(console, "error").mockImplementation(() => undefined);

        await expect(new CapacitorSystemBarAdapter().apply("dark")).resolves.toBeUndefined();
    });
});
