import { afterEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { i18n } from "@/presentation/i18n";
import FloatingDigitPad from "@/presentation/components/floating-digit-pad/FloatingDigitPad.vue";
import { useSettingsStore } from "@/stores/settingsStore";

const NO_DIGITS_PLACED = Array.from<number, number>({ length: 10 }, () => 0);

const mountPad = (props: Partial<InstanceType<typeof FloatingDigitPad>["$props"]> = {}, settings: Record<string, unknown> = {}) => {
    localStorage.setItem("sudoku-settings", JSON.stringify(settings));
    const pinia = createPinia();
    setActivePinia(pinia);
    return mount(FloatingDigitPad, {
        props: { cell: { row: 0, column: 0 }, digitCounts: NO_DIGITS_PLACED, ...props },
        global: { plugins: [pinia] },
    });
};

const digitKeys = (wrapper: ReturnType<typeof mountPad>) => wrapper.findAll("[data-skin~='floating-key']");

afterEach(() => {
    localStorage.clear();
});

describe("FloatingDigitPad", () => {
    it("should offer the digits 1 to 9 in order and an erase key", () => {
        const wrapper = mountPad();

        expect(digitKeys(wrapper).map(key => key.text())).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
        expect(wrapper.find("[data-skin~='floating-erase']").exists()).toBe(true);
    });

    it("should sit at the placement of its cell", () => {
        const style = mountPad({ cell: { row: 8, column: 8 } }).get("[data-testid='floating-digit-pad']").attributes("style");

        // Above and to the left of the bottom right cell: 8 - 3.6 of 9 rows, 8 - 3 of 9 columns
        expect(style).toContain(`top: ${(4.4 / 9) * 100}%`);
        expect(style).toContain(`left: ${(5 / 9) * 100}%`);
    });

    it("should follow when its cell changes", async () => {
        const wrapper = mountPad({ cell: { row: 0, column: 0 } });

        await wrapper.setProps({ cell: { row: 0, column: 1 } });

        expect(wrapper.get("[data-testid='floating-digit-pad']").attributes("style")).toContain(`left: ${(2 / 9) * 100}%`);
    });

    it("should emit the pressed digit and erase", async () => {
        const wrapper = mountPad({ currentEntry: 5 });

        await digitKeys(wrapper)[2].trigger("click");
        await wrapper.get("[data-skin~='floating-erase']").trigger("click");

        expect(wrapper.emitted("selectDigit")).toEqual([[3]]);
        expect(wrapper.emitted("erase")).toHaveLength(1);
    });

    it("should disable a digit the board holds nine times, and any digit it is told to", () => {
        const counts = [...NO_DIGITS_PLACED];
        counts[4] = 9;
        counts[5] = 8;

        const keys = digitKeys(mountPad({ digitCounts: counts, disabledDigits: [7] }));

        expect(keys[3].attributes("disabled")).toBeDefined();
        expect(keys[4].attributes("disabled")).toBeUndefined();
        expect(keys[6].attributes("disabled")).toBeDefined();
    });

    it.each([
        [{ eraseDisabled: true }, true],
        [{ eraseDisabled: false }, false],
    ])("should set the erase key's state from %o", (props, disabled) => {
        const erase = mountPad(props).get("[data-skin~='floating-erase']");

        expect(erase.attributes("disabled") !== undefined).toBe(disabled);
    });

    it("should mark the digit the cell holds", () => {
        const keys = digitKeys(mountPad({ currentEntry: 5 }));

        expect(keys.map(key => key.attributes("aria-pressed"))).toEqual(["false", "false", "false", "false", "true", "false", "false", "false", "false"]);
    });

    it("should mark the notes the cell holds in note mode, and show which mode it is in", () => {
        const wrapper = mountPad({ noteMode: true, currentNotes: [2, 9] });

        expect(digitKeys(wrapper).map(key => key.attributes("aria-pressed"))).toEqual(["false", "true", "false", "false", "false", "false", "false", "false", "true"]);
        expect(wrapper.get("[data-testid='floating-digit-pad']").attributes("data-note-mode")).toBe("true");
    });

    it("should not mark notes outside note mode", () => {
        const keys = digitKeys(mountPad({ noteMode: false, currentNotes: [2] }));

        expect(keys[1].attributes("aria-pressed")).toBe("false");
    });

    it("should say what each key does, in the player's language", async () => {
        const wrapper = mountPad();
        const english = digitKeys(wrapper)[0].attributes("aria-label");

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(digitKeys(wrapper)[0].attributes("aria-label")).not.toBe(english);
        i18n.global.locale.value = "en";
    });

    it("should enter with an animation when motion is allowed", () => {
        expect(mountPad({}, { motionEffects: true }).get("[data-testid='floating-digit-pad']").classes()).toContain("floating-pad-enter");
    });

    it("should appear without an entrance animation when motion is off", () => {
        const wrapper = mountPad({}, { motionEffects: false });

        expect(useSettingsStore().motionEffects).toBe(false);
        expect(wrapper.get("[data-testid='floating-digit-pad']").classes()).not.toContain("floating-pad-enter");
    });

    it("should draw an opaque surface, whatever is beneath it", () => {
        expect(mountPad().get("[data-testid='floating-digit-pad']").classes()).toContain("bg-card");
    });
});
