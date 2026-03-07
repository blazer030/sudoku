import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import HintMenuPopup from "@/presentation/components/hint-menu-popup/HintMenuPopup.vue";

describe("HintMenuPopup", () => {
    const mountPopup = (props: Record<string, unknown> = {}) =>
        mount(HintMenuPopup, {
            props: { recordedUsed: 0, canUseHint: true, ...props },
        });

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

        // 2 個已用（暗），1 個剩餘（亮）
        const usedDots = dots.filter(d => d.classes().some(c => c.includes("opacity")));
        expect(usedDots).toHaveLength(2);
    });

    it("點擊遮罩觸發 close 事件", async () => {
        const wrapper = mountPopup();

        await wrapper.find("[data-testid='hint-overlay']").trigger("click");

        expect(wrapper.emitted("close")).toHaveLength(1);
    });

    it("點擊各選項觸發對應 emit", async () => {
        const wrapper = mountPopup();

        await wrapper.find("[data-testid='hint-auto-notes']").trigger("click");
        expect(wrapper.emitted("autoNotes")).toHaveLength(1);

        await wrapper.find("[data-testid='hint-check-conflicts']").trigger("click");
        expect(wrapper.emitted("checkConflicts")).toHaveLength(1);

        await wrapper.find("[data-testid='hint-check-errors']").trigger("click");
        expect(wrapper.emitted("checkErrors")).toHaveLength(1);

        await wrapper.find("[data-testid='hint-reveal-cell']").trigger("click");
        expect(wrapper.emitted("revealCell")).toHaveLength(1);
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
