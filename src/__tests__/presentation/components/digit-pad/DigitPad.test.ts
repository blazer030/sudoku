import { mount } from "@vue/test-utils";
import DigitPad from "@/presentation/components/digit-pad/DigitPad.vue";
import { expectKeyRowsToShrinkToFit } from "@/__tests__/fixtures/digitKeyRows";

describe("DigitPad", () => {
    it("should shrink its keys to fit a row narrower than five 56px keys, and never grow them past 56px", () => {
        const wrapper = mount(DigitPad, {
            props: { selectedDigit: null, eraseActive: false, digitCounts: Array<number>(10).fill(0) },
        });

        expectKeyRowsToShrinkToFit(wrapper);
    });
});
