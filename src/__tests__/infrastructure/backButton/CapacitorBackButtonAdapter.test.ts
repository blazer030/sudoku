const { addListener } = vi.hoisted(() => ({ addListener: vi.fn() }));

vi.mock("@capacitor/app", () => ({ App: { addListener } }));

import { CapacitorBackButtonAdapter } from "@/infrastructure/backButton/CapacitorBackButtonAdapter";

describe("CapacitorBackButtonAdapter", () => {
    beforeEach(() => {
        addListener.mockReset().mockResolvedValue({ remove: vi.fn() });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should pass each Back press and whether the web view can go back to the handler", () => {
        const handler = vi.fn();

        new CapacitorBackButtonAdapter().listen(handler);
        const [eventName, listener] = addListener.mock.calls[0] as [string, (event: { canGoBack: boolean }) => void];
        listener({ canGoBack: true });

        expect(eventName).toBe("backButton");
        expect(handler).toHaveBeenCalledWith(true);
    });
});
