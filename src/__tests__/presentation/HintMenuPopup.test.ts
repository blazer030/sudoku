import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import HintMenuPopup from "@/presentation/components/hint-menu-popup/HintMenuPopup.vue";
import { provideHintMenu } from "@/presentation/components/hint-menu-popup/useHintMenu";
import type { HintParams } from "@/presentation/components/hint-menu-popup/useHintMenu";

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

    it("渲染 4 個選項", () => {
        const wrapper = mountPopup();

        expect(wrapper.find("[data-testid='hint-auto-notes']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='hint-check-conflicts']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='hint-check-errors']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='hint-reveal-cell']").exists()).toBe(true);
    });

    it("顯示 HintLights — 3 個圓點對應已用次數", () => {
        const wrapper = mountPopup({ recordedUsed: 2 });

        const dots = wrapper.findAll("[data-testid='hint-light']");
        expect(dots).toHaveLength(3);

        // 1 個剩餘（填色），2 個已用（邊框）
        const filledDots = dots.filter(dot => dot.classes().some(cssClass => cssClass.includes("bg-primary")));
        expect(filledDots).toHaveLength(1);
        const outlinedDots = dots.filter(dot => dot.classes().some(cssClass => cssClass.includes("border")));
        expect(outlinedDots).toHaveLength(2);
    });

    it("點擊遮罩觸發 close", async () => {
        const wrapper = mountPopup();

        await wrapper.find("[data-testid='hint-overlay']").trigger("click");

        expect(wrapper.find("[data-testid='hint-overlay']").exists()).toBe(false);
    });

    it("點擊各選項關閉彈窗", async () => {
        const testCases = ["hint-auto-notes", "hint-check-conflicts", "hint-check-errors", "hint-reveal-cell"];
        for (const testId of testCases) {
            const wrapper = mountPopup();
            await wrapper.find(`[data-testid='${testId}']`).trigger("click");
            expect(wrapper.find(`[data-testid='${testId}']`).exists()).toBe(false);
        }
    });

    it("提示全部用完時選項 disabled", () => {
        const wrapper = mountPopup({ canUseHint: false });

        const buttons = wrapper.findAll("button[data-testid^='hint-']");
        buttons.forEach(btn => {
            if (btn.attributes("data-testid") !== "hint-overlay") {
                expect(btn.attributes("disabled")).toBeDefined();
            }
        });
    });
});
