import { mount } from "@vue/test-utils";
import { Sparkles } from "lucide-vue-next";
import OptionTile from "@/presentation/components/option-tile/OptionTile.vue";

const mountTile = (pressed: boolean) => mount(OptionTile, {
    props: { pressed, label: "Completion Flash", description: "Flash a finished row or box", icon: Sparkles },
    attrs: { "data-testid": "toggle-motionEffects" },
    attachTo: document.body,
});

describe("OptionTile", () => {
    it("should expose its state with aria-pressed", async () => {
        const wrapper = mountTile(true);

        expect(wrapper.attributes("aria-pressed")).toBe("true");
        await wrapper.setProps({ pressed: false });
        expect(wrapper.attributes("aria-pressed")).toBe("false");
    });

    it("should be solid primary when pressed and an outline when not", () => {
        const pressed = mountTile(true);
        expect(pressed.classes()).toEqual(expect.arrayContaining(["bg-primary", "text-on-primary"]));

        const unpressed = mountTile(false);
        expect(unpressed.classes()).toEqual(expect.arrayContaining(["bg-card", "border-border"]));
        expect(unpressed.classes()).not.toContain("bg-primary");
    });

    it("should show a check mark only when pressed", () => {
        expect(mountTile(true).get("[data-testid='option-tile-mark']").find("svg").exists()).toBe(true);
        expect(mountTile(false).get("[data-testid='option-tile-mark']").find("svg").exists()).toBe(false);
    });

    it("should emit toggle on click", async () => {
        const wrapper = mountTile(true);

        await wrapper.trigger("click");

        expect(wrapper.emitted("toggle")).toHaveLength(1);
    });

    it("should give press feedback", async () => {
        const wrapper = mountTile(false);

        await wrapper.trigger("pointerdown");

        expect(wrapper.attributes()).toHaveProperty("data-pressed");
    });

    it("should render label and description", () => {
        const wrapper = mountTile(false);

        expect(wrapper.text()).toContain("Completion Flash");
        expect(wrapper.text()).toContain("Flash a finished row or box");
        expect(wrapper.attributes("data-testid")).toBe("toggle-motionEffects");
        expect(wrapper.find("button").element).toBe(wrapper.element);
        expect(wrapper.attributes("type")).toBe("button");
    });
});
