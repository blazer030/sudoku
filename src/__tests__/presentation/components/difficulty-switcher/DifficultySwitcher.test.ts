import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import DifficultySwitcher from "@/presentation/components/difficulty-switcher/DifficultySwitcher.vue";
import { i18n } from "@/presentation/i18n";

describe("DifficultySwitcher", () => {
    it("should show English difficulty labels by default", () => {
        const wrapper = mount(DifficultySwitcher, { props: { modelValue: "easy" } });

        expect(wrapper.text()).toBe("EasyMediumHard");
    });

    it("should show Chinese difficulty labels when the language is zh-Hant", async () => {
        const wrapper = mount(DifficultySwitcher, { props: { modelValue: "easy" } });
        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(wrapper.text()).toBe("簡單中等困難");
    });

    it("should mark itself as a menu of choices, still a segmented control", () => {
        const wrapper = mount(DifficultySwitcher, { props: { modelValue: "easy" } });
        const tokens = (wrapper.attributes("data-skin") ?? "").split(" ");

        expect(tokens).toContain("segmented");
        expect(tokens).toContain("menu");
    });
});
