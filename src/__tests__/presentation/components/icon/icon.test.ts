import { mount } from "@vue/test-utils";
import * as icons from "@/presentation/components/icon";
import { selectIconStyle, type IconSetLoader } from "@/presentation/components/icon/activeIconSet";
import { ICON_NAMES, type IconName, type IconSet } from "@/style/iconSet";
import type { StyleId } from "@/theme/themeIds";
import { h, nextTick } from "vue";

const useSet = async (overrides: Partial<IconSet> = {}, drawing = "<path d=\"M0 0\"/>") => {
    const iconSet: IconSet = {
        viewBox: "0 0 8 8",
        drawings: Object.fromEntries(ICON_NAMES.map(name => [name, drawing])) as Record<IconName, string>,
        ...overrides,
    };
    const loaders = { minimal: null, pixel: () => Promise.resolve(iconSet) } as Record<StyleId, IconSetLoader | null>;
    await selectIconStyle("pixel", loaders);
};

describe("icons", () => {
    it("should export a component for each of the app's icons", () => {
        expect(Object.keys(icons).sort()).toEqual([...ICON_NAMES].sort());
        expect(ICON_NAMES).toHaveLength(44);
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

    describe("with a style's own set", () => {
        afterEach(async () => {
            await selectIconStyle("minimal");
        });

        it("should draw the set's markup instead of lucide's", async () => {
            await useSet();

            const svg = mount(icons.Pencil).find("svg");

            expect(svg.classes()).not.toContain("lucide");
            expect(svg.attributes("viewBox")).toBe("0 0 8 8");
            expect(svg.find("path").attributes("d")).toBe("M0 0");
        });

        it("should keep the same size, class, name and hiding as lucide's", async () => {
            await useSet();

            const svg = mount(icons.Pencil, { attrs: { size: 18, class: "text-primary" } }).find("svg");

            expect(svg.attributes()).toMatchObject({ width: "18", height: "18", "data-icon": "Pencil", "aria-hidden": "true" });
            expect(svg.classes()).toContain("text-primary");
        });

        it("should default to lucide's size when none is asked for", async () => {
            await useSet();

            expect(mount(icons.Pencil).find("svg").attributes("width")).toBe("24");
        });

        it("should carry the set's svg attributes", async () => {
            await useSet({ svgAttributes: { "shape-rendering": "crispEdges" } });

            expect(mount(icons.Pencil).find("svg").attributes("shape-rendering")).toBe("crispEdges");
        });

        it("should put the shared markup before the drawing", async () => {
            await useSet({ defs: "<defs></defs>" });

            expect(mount(icons.Pencil).find("svg").html()).toMatch(/<defs>.*<path/s);
        });

        it("should give two instances of an icon different ids", async () => {
            await useSet({}, "<mask id=\"{id}\"></mask><g mask=\"url(#{id})\"></g>");

            const masks = mount({ render: () => [h(icons.Pencil), h(icons.Pencil)] }).findAll("mask");

            expect(masks[0].attributes("id")).toBeTruthy();
            expect(masks[0].attributes("id")).not.toBe(masks[1].attributes("id"));
        });

        it("should point every use of the id at the instance's own", async () => {
            await useSet({}, "<mask id=\"{id}\"></mask><g mask=\"url(#{id})\"></g>");

            const svg = mount(icons.Pencil).find("svg");

            expect(svg.find("g").attributes("mask")).toBe(`url(#${svg.find("mask").attributes("id") ?? ""})`);
        });

        it("should show the size the set snaps to", async () => {
            await useSet({ snapSize: () => 16 });

            expect(mount(icons.Pencil, { attrs: { size: 11 } }).find("svg").attributes("width")).toBe("16");
        });

        it.each([[20, true], [22, false]])("should say whether size %i is too small for fine detail", async (size, small) => {
            await useSet();

            const svg = mount(icons.Pencil, { attrs: { size } }).find("svg");

            expect(svg.attributes("data-icon-small") !== undefined).toBe(small);
        });

        it("should go back to lucide when the style has no set", async () => {
            await useSet();
            const wrapper = mount(icons.Pencil);

            await selectIconStyle("minimal");
            await nextTick();

            expect(wrapper.find("svg").classes()).toContain("lucide-pencil");
        });
    });
});
