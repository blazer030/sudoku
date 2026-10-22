import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { change, addListener } = vi.hoisted(() => ({
    change: vi.fn(),
    addListener: vi.fn(),
}));

vi.mock("@capacitor-community/app-icon", () => ({ AppIcon: { change } }));
vi.mock("@capacitor/app", () => ({ App: { addListener } }));

import { DynamicIconAdapter } from "@/infrastructure/icon/DynamicIconAdapter";
import { LAUNCHER_ICONS } from "@/theme/launcherIcon";

describe("DynamicIconAdapter", () => {
    let triggerPause: () => void;

    beforeEach(() => {
        change.mockReset().mockResolvedValue(undefined);
        addListener.mockReset().mockImplementation((eventName: string, callback: () => void) => {
            if (eventName === "pause") triggerPause = callback;
            return Promise.resolve({ remove: vi.fn() });
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("does not change the icon while the app is in the foreground", async () => {
        const adapter = new DynamicIconAdapter();
        await adapter.setIcon("blue");
        expect(change).not.toHaveBeenCalled();
    });

    it("applies the pending icon when the app goes to the background", async () => {
        const adapter = new DynamicIconAdapter();
        await adapter.setIcon("blue");
        triggerPause();
        expect(change).toHaveBeenCalledTimes(1);
        expect(change).toHaveBeenCalledWith({
            name: "blue",
            disable: LAUNCHER_ICONS.map(icon => icon.key).filter(key => key !== "blue"),
            suppressNotification: false,
        });
    });

    it("disables every other alias, light and dark, when applying a dark icon", async () => {
        const adapter = new DynamicIconAdapter();
        await adapter.setIcon("paperRedInkDark");
        triggerPause();
        const { name, disable } = change.mock.calls[0][0] as { name: string; disable: string[] };
        expect(name).toBe("paperRedInkDark");
        expect(disable).toHaveLength(LAUNCHER_ICONS.length - 1);
        expect(disable).toContain("green");
        expect(disable).toContain("minimalGreenDark");
        expect(disable).not.toContain("paperRedInkDark");
    });

    it("applies only the last requested icon", async () => {
        const adapter = new DynamicIconAdapter();
        await adapter.setIcon("blue");
        await adapter.setIcon("pink");
        triggerPause();
        expect(change).toHaveBeenCalledTimes(1);
        expect(change).toHaveBeenCalledWith(expect.objectContaining({ name: "pink" }));
    });

    it("does nothing on pause when no icon is pending", () => {
        new DynamicIconAdapter();
        triggerPause();
        expect(change).not.toHaveBeenCalled();
    });

    it("applies a pending icon only once across repeated pauses", async () => {
        const adapter = new DynamicIconAdapter();
        await adapter.setIcon("blue");
        triggerPause();
        triggerPause();
        expect(change).toHaveBeenCalledTimes(1);
    });

    it("logs instead of throwing when changing the icon fails", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        change.mockRejectedValue(new Error("boom"));
        const adapter = new DynamicIconAdapter();
        await adapter.setIcon("blue");
        expect(() => {
            triggerPause();
        }).not.toThrow();
        await vi.waitFor(() => {
            expect(consoleError).toHaveBeenCalled();
        });
    });
});
