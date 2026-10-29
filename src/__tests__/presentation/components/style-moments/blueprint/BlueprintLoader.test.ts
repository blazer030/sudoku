import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import BlueprintLoader from "@/presentation/components/style-moments/blueprint/BlueprintLoader.vue";

// The canvas's plot: the outline in one stroke, then on along it to the two lines down and the two across
const PLOT = "M10 10 H110 V110 H10 V10 H43 V110 H77 V10 H110 V43 H10 V77 H110";

describe("BlueprintLoader", () => {
    afterEach(() => {
        i18n.global.locale.value = "en";
    });

    it("should be blueprint's loader", () => {
        expect(STYLE_MOMENTS.blueprint.loader).toBe(BlueprintLoader);
    });

    // The card's double frame is drawn 5.75px into the sheet, so the title block's rules start inside it
    it("should be a 276px drawing sheet in the cards' double frame, its content inside the frame", () => {
        const sheet = mount(BlueprintLoader).get(".blueprint-loader");

        expect(sheet.classes()).toEqual(expect.arrayContaining(["w-[276px]", "p-1.5"]));
        expect(sheet.attributes("data-skin")).toBe("card");
    });

    it("should plot a 3×3 box in one path, the outline and then the four inner lines, as decoration", () => {
        const wrapper = mount(BlueprintLoader);
        const drawing = wrapper.get(".blueprint-loader-drawing");
        const plots = drawing.findAll(".blueprint-loader-plot");

        expect(drawing.attributes("aria-hidden")).toBe("true");
        expect(plots).toHaveLength(1);
        expect(plots[0].element.tagName.toLowerCase()).toBe("path");
        expect(plots[0].attributes("d")).toBe(PLOT);
        expect(plots[0].attributes("pathLength")).toBe("1");
    });

    // The line is dashed on and the pen moved along the path at the same pace, so the pen always sits on the
    // line's end
    it("should run the pen along the plot's own path", () => {
        const wrapper = mount(BlueprintLoader);
        const pen = wrapper.get(".blueprint-loader-drawing .blueprint-loader-pen");

        expect((pen.element as HTMLElement).style.getPropertyValue("--blueprint-loader-path")).toBe(`path("${PLOT}")`);
        expect(pen.classes()).toContain("text-primary");
    });

    it("should dimension the box in 3 columns, in the current language", async () => {
        const wrapper = mount(BlueprintLoader);
        const dimension = wrapper.get(".blueprint-loader-drawing .blueprint-loader-dimension");
        const english = dimension.text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(english).toContain("3");
        expect(dimension.text()).toContain("3");
        expect(dimension.text()).not.toBe(english);
    });

    it("should caption the title block in the current language", async () => {
        const wrapper = mount(BlueprintLoader);
        const caption = wrapper.get(".blueprint-loader-caption");
        const english = caption.text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(caption.text()).not.toBe(english);
        expect(caption.text()).not.toBe("");
        expect(caption.attributes("aria-hidden")).toBeUndefined();
    });

    it("should show a screen's own message instead", () => {
        const wrapper = mount(BlueprintLoader, { props: { message: "Checking…" } });

        expect(wrapper.get(".blueprint-loader-caption").text()).toBe("Checking…");
    });

    it("should read out the pen's X and Y beside the caption, as decoration", () => {
        const wrapper = mount(BlueprintLoader);
        const coordinates = wrapper.get(".blueprint-loader-coordinates");
        const readings = coordinates.findAll("b").map(reading => reading.text());

        expect(coordinates.attributes("aria-hidden")).toBe("true");
        expect(readings.length).toBeGreaterThan(2);
        expect(readings.length % 2).toBe(0);
        readings.forEach((reading, position) => {
            expect(reading).toMatch(position % 2 === 0 ? /^X \d{3}\.\d$/ : /^Y \d{3}\.\d$/);
        });
    });

    it("should close the title block with the sheet's number, as decoration", () => {
        const wrapper = mount(BlueprintLoader);
        const sheetNumber = wrapper.get(".blueprint-loader-sheet-number");

        expect(sheetNumber.text()).toBe("SDK-09 · SHT 01/01 · 1:1");
        expect(sheetNumber.attributes("aria-hidden")).toBe("true");
    });
});
