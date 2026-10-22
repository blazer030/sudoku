import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import { i18n } from "@/presentation/i18n";
import HintMenuPopup from "@/presentation/pages/game/components/HintMenuPopup.vue";
import { provideHintMenu } from "@/presentation/pages/game/components/useHintMenu";
import type { HintParams } from "@/presentation/pages/game/components/useHintMenu";

describe("HintMenuPopup", () => {
    const mountPopup = (params: Partial<HintParams> = {}) => {
        const Host = defineComponent({
            components: { HintMenuPopup },
            setup() {
                const hintMenu = provideHintMenu();
                void hintMenu.open({ remaining: 4, firstHintFree: true, ...params });
                return {};
            },
            template: "<HintMenuPopup />",
        });
        return mount(Host);
    };

    it("should render 3 hint options and no Check Errors", () => {
        const wrapper = mountPopup();

        expect(wrapper.find("[data-testid='hint-auto-notes']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='hint-check-conflicts']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='hint-check-errors']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='hint-reveal-cell']").exists()).toBe(true);
    });

    it("should render the hint options in Traditional Chinese", async () => {
        const wrapper = mountPopup();
        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(wrapper.find("[data-testid='hint-auto-notes']").text()).toBe("自動筆記");
        expect(wrapper.find("[data-testid='hint-check-conflicts']").text()).toContain("檢查衝突");
        expect(wrapper.find("[data-testid='hint-reveal-cell']").text()).toBe("揭示一格");
    });

    it("should explain that Check Conflicts looks for repeated digits", () => {
        const wrapper = mountPopup();

        expect(wrapper.find("[data-testid='hint-check-conflicts-description']").text()).toBe("Finds repeated digits in a row, column or box");
    });

    it("should spell out how many hints are left", () => {
        const wrapper = mountPopup({ remaining: 3 });

        expect(wrapper.find("[data-testid='hint-remaining']").text()).toBe("3 hints left this game");
        expect(wrapper.find("[data-testid='hint-light']").exists()).toBe(false);
    });

    it("should use the singular for the last hint", () => {
        const wrapper = mountPopup({ remaining: 1 });

        expect(wrapper.find("[data-testid='hint-remaining']").text()).toBe("1 hint left this game");
    });

    it("should explain the free first hint only before any hint is used", () => {
        const wrapper = mountPopup({ firstHintFree: true });
        expect(wrapper.find("[data-testid='hint-free-note']").text()).toBe("Your first hint each game is free and isn't counted in statistics.");

        const usedWrapper = mountPopup({ firstHintFree: false });
        expect(usedWrapper.find("[data-testid='hint-free-note']").exists()).toBe(false);
    });

    it("should be wide enough and balance its wrapped lines so short words are not left alone", () => {
        const wrapper = mountPopup({ remaining: 0, firstHintFree: false });

        expect(wrapper.find("[data-testid='hint-menu']").classes()).toContain("w-72");
        expect(wrapper.find("[data-testid='hint-used-up']").classes()).toContain("text-balance");
        expect(wrapper.find("[data-testid='hint-check-conflicts-description']").classes()).toContain("text-balance");
    });

    it("should say why the options are off when no hints are left", () => {
        const wrapper = mountPopup({ remaining: 0, firstHintFree: false });

        expect(wrapper.find("[data-testid='hint-used-up']").text()).toBe("No hints left in this game (4 per game)");
        expect(wrapper.find("[data-testid='hint-remaining']").exists()).toBe(false);
        for (const testId of ["hint-auto-notes", "hint-check-conflicts", "hint-reveal-cell"]) {
            expect(wrapper.find(`[data-testid='${testId}']`).attributes("disabled")).toBeDefined();
        }
    });

    it("should close when clicking overlay", async () => {
        const wrapper = mountPopup();

        await wrapper.find("[data-testid='hint-overlay']").trigger("click");

        expect(wrapper.find("[data-testid='hint-overlay']").exists()).toBe(false);
    });

    it("should close popup when clicking each option", async () => {
        const testCases = ["hint-auto-notes", "hint-check-conflicts", "hint-reveal-cell"];
        for (const testId of testCases) {
            const wrapper = mountPopup();
            await wrapper.find(`[data-testid='${testId}']`).trigger("click");
            expect(wrapper.find(`[data-testid='${testId}']`).exists()).toBe(false);
        }
    });

    it("should disable options when all hints are used", () => {
        const wrapper = mountPopup({ remaining: 0 });

        const buttons = wrapper.findAll("button[data-testid^='hint-']");
        buttons.forEach(btn => {
            if (btn.attributes("data-testid") !== "hint-overlay") {
                expect(btn.attributes("disabled")).toBeDefined();
            }
        });
    });
});
