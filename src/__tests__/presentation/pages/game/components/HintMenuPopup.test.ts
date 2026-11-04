import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import { i18n } from "@/presentation/i18n";
import HintMenuPopup from "@/presentation/pages/game/components/HintMenuPopup.vue";
import { provideHintMenu } from "@/presentation/pages/game/components/useHintMenu";

describe("HintMenuPopup", () => {
    const mountPopup = () => {
        const Host = defineComponent({
            components: { HintMenuPopup },
            setup() {
                const hintMenu = provideHintMenu();
                void hintMenu.open();
                return {};
            },
            template: "<HintMenuPopup />",
        });
        return mount(Host);
    };

    it("should offer Check Conflicts and Reveal Cell, and neither Auto Notes nor any hint count", () => {
        const wrapper = mountPopup();

        expect(wrapper.findAll("[data-skin~='menu-option']").map(option => option.attributes("data-testid")))
            .toEqual(["hint-check-conflicts", "hint-reveal-cell"]);
        for (const removed of ["hint-auto-notes", "hint-remaining", "hint-used-up", "hint-free-note"]) {
            expect(wrapper.find(`[data-testid='${removed}']`).exists()).toBe(false);
        }
    });

    it("should render the hint options in Traditional Chinese", async () => {
        const wrapper = mountPopup();
        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(wrapper.find("[data-testid='hint-check-conflicts']").text()).toContain("檢查衝突");
        expect(wrapper.find("[data-testid='hint-reveal-cell']").text()).toBe("揭示一格");
    });

    it("should explain that Check Conflicts looks for repeated digits", () => {
        const wrapper = mountPopup();

        expect(wrapper.find("[data-testid='hint-check-conflicts-description']").text()).toBe("Finds repeated digits in a row, column or box");
    });

    it("should close when clicking overlay", async () => {
        const wrapper = mountPopup();

        await wrapper.find("[data-testid='hint-overlay']").trigger("click");

        expect(wrapper.find("[data-testid='hint-overlay']").exists()).toBe(false);
    });

    it("should close popup when clicking each option", async () => {
        const testCases = ["hint-check-conflicts", "hint-reveal-cell"];
        for (const testId of testCases) {
            const wrapper = mountPopup();
            await wrapper.find(`[data-testid='${testId}']`).trigger("click");
            expect(wrapper.find(`[data-testid='${testId}']`).exists()).toBe(false);
        }
    });
});
