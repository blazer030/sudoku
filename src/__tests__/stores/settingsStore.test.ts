import { createPinia, setActivePinia } from "pinia";
import { useSettingsStore } from "@/stores/settingsStore";
import { updateMetaThemeColor, updateFavicon, updateManifestLink, updateAppleTouchIcon } from "@/application/PwaThemeUpdater";
import type { IconService } from "@/application/icon/IconService";

vi.mock("@/application/PwaThemeUpdater", () => ({
    updateMetaThemeColor: vi.fn(),
    updateFavicon: vi.fn(),
    updateManifestLink: vi.fn(),
    updateAppleTouchIcon: vi.fn(),
}));

describe("settingsStore", () => {
    beforeEach(() => {
        localStorage.clear();
        setActivePinia(createPinia());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should have default values on first load", () => {
        const store = useSettingsStore();

        expect(store.colorTheme).toBe("green");
        expect(store.highlightSameDigit).toBe(true);
        expect(store.completionFlash).toBe(true);
        expect(store.autoRemoveNotes).toBe(true);
        expect(store.showRemainingCount).toBe(true);
        expect(store.matchLauncherIconToTheme).toBe(false);
    });

    it("should persist colorTheme change to localStorage", () => {
        const store = useSettingsStore();

        store.setColorTheme("blue");

        expect(store.colorTheme).toBe("blue");
        const stored = JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
        expect(stored.colorTheme).toBe("blue");
    });

    it("should persist boolean setting changes to localStorage", () => {
        const store = useSettingsStore();

        store.setHighlightSameDigit(false);
        store.setCompletionFlash(false);
        store.setAutoRemoveNotes(false);
        store.setShowRemainingCount(false);

        expect(store.highlightSameDigit).toBe(false);
        expect(store.completionFlash).toBe(false);
        expect(store.autoRemoveNotes).toBe(false);
        expect(store.showRemainingCount).toBe(false);

        const stored = JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
        expect(stored.highlightSameDigit).toBe(false);
        expect(stored.completionFlash).toBe(false);
    });

    it("should set data-color-theme on document element on init", () => {
        useSettingsStore();

        expect(document.documentElement.dataset.colorTheme).toBe("green");
    });

    it("should update data-color-theme when colorTheme changes", () => {
        const store = useSettingsStore();

        store.setColorTheme("purple");

        expect(document.documentElement.dataset.colorTheme).toBe("purple");
    });

    it("should call PwaThemeUpdater functions when setting color theme", () => {
        const store = useSettingsStore();

        store.setColorTheme("blue");

        expect(updateMetaThemeColor).toHaveBeenCalledWith("blue");
        expect(updateFavicon).toHaveBeenCalledWith("blue");
        expect(updateManifestLink).toHaveBeenCalledWith("blue");
        expect(updateAppleTouchIcon).toHaveBeenCalledWith("blue");
    });

    describe("icon sync", () => {
        const buildIconService = (): { service: IconService; setIcon: ReturnType<typeof vi.fn> } => {
            const setIcon = vi.fn().mockResolvedValue(undefined);
            return { service: { setIcon }, setIcon };
        };

        it("calls IconService.setIcon when theme changes and toggle is ON", async () => {
            const { service, setIcon } = buildIconService();
            const store = useSettingsStore();
            store.setIconService(service);
            store.setMatchLauncherIconToTheme(true);
            setIcon.mockClear();

            store.setColorTheme("blue");
            await Promise.resolve();

            expect(setIcon).toHaveBeenCalledWith("blue");
        });

        it("does NOT call IconService.setIcon when theme changes and toggle is OFF", async () => {
            const { service, setIcon } = buildIconService();
            const store = useSettingsStore();
            store.setIconService(service);

            store.setColorTheme("blue");
            await Promise.resolve();

            expect(setIcon).not.toHaveBeenCalled();
        });

        it("calls IconService.setIcon when toggle transitions OFF → ON (sync to current theme)", async () => {
            const { service, setIcon } = buildIconService();
            const store = useSettingsStore();
            store.setIconService(service);
            store.setColorTheme("purple");
            setIcon.mockClear();

            store.setMatchLauncherIconToTheme(true);
            await Promise.resolve();

            expect(setIcon).toHaveBeenCalledWith("purple");
        });

        it("does not call IconService.setIcon when toggle transitions ON → OFF", async () => {
            const { service, setIcon } = buildIconService();
            const store = useSettingsStore();
            store.setIconService(service);
            store.setMatchLauncherIconToTheme(true);
            setIcon.mockClear();

            store.setMatchLauncherIconToTheme(false);
            await Promise.resolve();

            expect(setIcon).not.toHaveBeenCalled();
        });
    });
});
