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

    it("should stamp the card with today's date, month and day without the year", () => {
        const stamp = mount(PaperCelebration, { props: { still: false } }).get(".paper-stamp");

        expect(stamp.get("small").text()).toBe("03/07");
        expect(stamp.attributes("aria-hidden")).toBe("true");
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

    it("should spread the stamp's ring only when the stamp lands with motion", () => {
        expect(mount(PaperCelebration, { props: { still: false } }).find(".paper-stamp-splat").exists()).toBe(true);
    });

    it("should show the stamp already there, without its ring, when still", () => {
        const wrapper = mount(PaperCelebration, { props: { still: true } });

        expect(wrapper.find(".paper-stamp").exists()).toBe(true);
        expect(wrapper.find(".paper-stamp-splat").exists()).toBe(false);
    });
});
