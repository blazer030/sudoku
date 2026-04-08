import { createPinia, setActivePinia } from "pinia";
import { useSettingsStore } from "@/stores/settingsStore";

describe("settingsStore", () => {
    beforeEach(() => {
        localStorage.clear();
        setActivePinia(createPinia());
    });

    it("should have default values on first load", () => {
        const store = useSettingsStore();

        expect(store.colorTheme).toBe("green");
        expect(store.highlightSameDigit).toBe(true);
        expect(store.completionFlash).toBe(true);
        expect(store.autoRemoveNotes).toBe(true);
        expect(store.showRemainingCount).toBe(true);
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
});
