import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import PaperCelebration from "@/presentation/components/style-moments/paper/PaperCelebration.vue";

describe("PaperCelebration", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 7, 21, 30));
    });

    afterEach(() => {
        vi.useRealTimers();
        i18n.global.locale.value = "en";
    });

    it("should stamp the card with today's date, month and day unpadded and without the year", () => {
        const stamp = mount(PaperCelebration, { props: { still: false } }).get(".paper-stamp");

        expect(stamp.get("small").text()).toBe("3/7");
        expect(stamp.attributes("aria-hidden")).toBe("true");
    });

    // The monospace stack is not bundled: Android drew the date's zero slashed (「1Ø/25」)
    it("should write the date in the bundled hand face, like the stamp's word", () => {
        const date = mount(PaperCelebration, { props: { still: false } }).get(".paper-stamp small");

        expect(date.classes()).toContain("font-hand");
        expect(date.classes()).not.toContain("font-mono");
    });

    // Review Focus 4: the stamp follows the language, like every other word on the dialog
    it("should switch the stamp's word with the language", async () => {
        const word = mount(PaperCelebration, { props: { still: false } }).get(".paper-stamp b");
        const english = word.text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(english).not.toBe("");
        expect(word.text()).not.toBe(english);
        expect(word.text()).not.toBe("");
    });

    it("should set a long stamp word smaller than a short one, so it stays inside the ring", async () => {
        const word = mount(PaperCelebration, { props: { still: false } }).get(".paper-stamp b");
        const englishSize = word.classes().find(name => name.startsWith("text-["));

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(englishSize).toBe("text-[20px]");
        expect(word.classes()).toContain("text-[26px]");
    });

    it("should spread the stamp's ring only when the stamp lands with motion", () => {
        expect(mount(PaperCelebration, { props: { still: false } }).find(".paper-stamp-splat").exists()).toBe(true);
    });

    it("should show the stamp already there, without its ring, when still", () => {
        const wrapper = mount(PaperCelebration, { props: { still: true } });

        expect(wrapper.find(".paper-stamp").exists()).toBe(true);
        expect(wrapper.find(".paper-stamp-splat").exists()).toBe(false);
    });
});
