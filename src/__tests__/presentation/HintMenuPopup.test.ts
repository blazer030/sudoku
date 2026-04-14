import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import HintMenuPopup from "@/presentation/pages/game/components/HintMenuPopup.vue";
import { provideHintMenu } from "@/presentation/pages/game/components/useHintMenu";
import type { HintParams } from "@/presentation/pages/game/components/useHintMenu";

describe("HintMenuPopup", () => {
    const mountPopup = (params: Partial<HintParams> = {}) => {
        const Host = defineComponent({
            components: { HintMenuPopup },
            setup() {
                const hintMenu = provideHintMenu();
                void hintMenu.open({ recordedUsed: 0, canUseHint: true, ...params });
                return {};
            },
            template: "<HintMenuPopup />",
        });
        return mount(Host);
    };

    it("should render 4 hint options", () => {
        const wrapper = mountPopup();

        expect(wrapper.find("[data-testid='hint-auto-notes']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='hint-check-conflicts']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='hint-check-errors']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='hint-reveal-cell']").exists()).toBe(true);
    });

    it("should display 3 hint lights matching usage count", () => {
        const wrapper = mountPopup({ recordedUsed: 2 });

        const dots = wrapper.findAll("[data-testid='hint-light']");
        expect(dots).toHaveLength(3);

        // 1 個剩餘（填色），2 個已用（邊框）
        const filledDots = dots.filter(dot => dot.classes().some(cssClass => cssClass.includes("bg-primary")));
        expect(filledDots).toHaveLength(1);
        const outlinedDots = dots.filter(dot => dot.classes().some(cssClass => cssClass.includes("border")));
        expect(outlinedDots).toHaveLength(2);
    });

    it("should close when clicking overlay", async () => {
        const wrapper = mountPopup();

        await wrapper.find("[data-testid='hint-overlay']").trigger("click");

        expect(wrapper.find("[data-testid='hint-overlay']").exists()).toBe(false);
    });

    it("should close popup when clicking each option", async () => {
        const testCases = ["hint-auto-notes", "hint-check-conflicts", "hint-check-errors", "hint-reveal-cell"];
        for (const testId of testCases) {
            const wrapper = mountPopup();
            await wrapper.find(`[data-testid='${testId}']`).trigger("click");
            expect(wrapper.find(`[data-testid='${testId}']`).exists()).toBe(false);
        }
    });

    it("should disable options when all hints are used", () => {
        const wrapper = mountPopup({ canUseHint: false });

        const buttons = wrapper.findAll("button[data-testid^='hint-']");
        buttons.forEach(btn => {
            if (btn.attributes("data-testid") !== "hint-overlay") {
                expect(btn.attributes("disabled")).toBeDefined();
            }
        });
    });
});
