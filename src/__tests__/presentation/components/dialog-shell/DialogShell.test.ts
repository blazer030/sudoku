import { h } from "vue";
import { mount } from "@vue/test-utils";
import DialogShell from "@/presentation/components/dialog-shell/DialogShell.vue";
import { Save } from "@/presentation/components/icon";

const mountShell = (tone: "primary" | "danger" = "primary") => mount(DialogShell, {
    props: { visible: true, testId: "shell", icon: Save, tone, title: "Title" },
    slots: { message: () => h("p", "Message"), default: () => h("button", { "data-testid": "action" }, "OK") },
});

describe("DialogShell", () => {
    it("should be a modal dialog named by its title", () => {
        const wrapper = mountShell();
        const card = wrapper.find("[role='dialog']");

        expect(card.attributes("aria-modal")).toBe("true");
        expect(wrapper.find(`#${card.attributes("aria-labelledby") ?? ""}`).text()).toBe("Title");
    });

    it("should mark a danger dialog's icon tile for the skin", () => {
        expect(mountShell("danger").find("[data-skin~='icon-tile']").attributes("data-skin")).toBe("icon-tile danger");
        expect(mountShell().find("[data-skin~='icon-tile']").attributes("data-skin")).toBe("icon-tile");
    });

    it("should report a tap on the scrim, but not one inside the card", async () => {
        const wrapper = mountShell();

        await wrapper.find("[data-testid='action']").trigger("click");
        expect(wrapper.emitted("scrimClick")).toBeUndefined();

        await wrapper.find("[data-testid='shell']").trigger("click");
        expect(wrapper.emitted("scrimClick")).toHaveLength(1);
    });
});
