import { mount } from "@vue/test-utils";
import * as icons from "@/presentation/components/icon";
import { ICON_NAMES } from "@/style/iconSet";

describe("icons", () => {
    it("should export a component for each of the app's icons", () => {
        expect(Object.keys(icons).sort()).toEqual([...ICON_NAMES].sort());
        expect(ICON_NAMES).toHaveLength(43);
    });

    it("should pass size and class through to the drawing", () => {
        const wrapper = mount(icons.Pencil, { attrs: { size: 18, class: "text-primary" } });

        const svg = wrapper.find("svg");
        expect(svg.attributes("width")).toBe("18");
        expect(svg.classes()).toContain("text-primary");
    });

    it("should mark the drawing with the icon's name and hide it from assistive tech", () => {
        const svg = mount(icons.Pencil).find("svg");

        expect(svg.attributes("data-icon")).toBe("Pencil");
        expect(svg.attributes("aria-hidden")).toBe("true");
    });

    it("should draw lucide's icon while no style has its own", () => {
        expect(mount(icons.Pencil).find("svg").classes()).toContain("lucide-pencil");
    });
});
