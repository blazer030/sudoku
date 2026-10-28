import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import ChalkboardCardDecoration from "@/presentation/components/style-moments/chalkboard/ChalkboardCardDecoration.vue";

interface Box { left: number; right: number; top: number; bottom: number }

// The box round a path's points, its control points included (so it holds the curve): absolute M, relative l, q, t
const boxOf = (path: string): Box => {
    const points: { x: number; y: number }[] = [];
    let current = { x: 0, y: 0 };
    let control = current;
    for (const [, command = "", argumentText = ""] of path.matchAll(/([MlqtzZ])([^MlqtzZ]*)/g)) {
        const numbers = argumentText.trim().split(/[\s,]+/).filter(Boolean).map(Number);
        const stride = command === "q" ? 4 : 2;
        for (let offset = 0; offset + stride <= numbers.length; offset += stride) {
            const [first = 0, second = 0, third = 0, fourth = 0] = numbers.slice(offset, offset + stride);
            if (command === "M") {
                current = { x: first, y: second };
            } else if (command === "q") {
                control = { x: current.x + first, y: current.y + second };
                points.push(control);
                current = { x: current.x + third, y: current.y + fourth };
            } else if (command === "t") {
                control = { x: 2 * current.x - control.x, y: 2 * current.y - control.y };
                points.push(control);
                current = { x: current.x + first, y: current.y + second };
            } else {
                current = { x: current.x + first, y: current.y + second };
            }
            points.push(current);
        }
    }
    const xs = points.map(point => point.x);
    const ys = points.map(point => point.y);
    return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
};

describe("ChalkboardCardDecoration", () => {
    afterEach(() => {
        i18n.global.locale.value = "en";
    });

    it("should be chalk's card decoration", () => {
        expect(STYLE_MOMENTS.chalkboard.cardDecoration).toBe(ChalkboardCardDecoration);
    });

    it("should write the cheer on the card as decoration, beside the real title", () => {
        const cheer = mount(ChalkboardCardDecoration, { props: { still: false } }).get(".chalkboard-cheer");

        expect(cheer.attributes("aria-hidden")).toBe("true");
        expect(cheer.get(".chalkboard-cheer-text").text()).not.toBe("");
    });

    it("should switch the cheer with the language", async () => {
        const text = mount(ChalkboardCardDecoration, { props: { still: false } }).get(".chalkboard-cheer-text");
        const english = text.text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(text.text()).not.toBe("");
        expect(text.text()).not.toBe(english);
    });

    it("should drop three specks of dust under the cheer, left to right, while it is written", () => {
        const dust = mount(ChalkboardCardDecoration, { props: { still: false } }).findAll(".chalkboard-cheer > .chalkboard-cheer-dust");

        expect(dust.map(speck => speck.attributes("data-step"))).toEqual(["0", "1", "2"]);
    });

    // On the card with the cheer, not behind it: MomentsChalk's doodles, in the order they are drawn
    it("should doodle two stars, a wave and rays on the card, in turn, in three chalks", () => {
        const doodles = mount(ChalkboardCardDecoration, { props: { still: false } }).get(".chalkboard-doodles");
        const paths = doodles.findAll(".chalkboard-doodle");

        expect(doodles.attributes("aria-hidden")).toBe("true");
        expect(paths.map(doodle => doodle.attributes("data-shape"))).toEqual(["star", "star", "wave", "rays"]);
        expect(paths.map(doodle => doodle.attributes("data-step"))).toEqual(["0", "1", "2", "3"]);
        expect(paths.map(doodle => doodle.attributes("data-tone"))).toEqual(["primary", "doodle", "accent", "primary"]);
        for (const doodle of paths) {
            expect(doodle.attributes("stroke")).toBe("currentColor");
            expect(doodle.attributes("fill")).toBe("none");
        }
        expect(doodles.find("filter").exists()).toBe(false);
    });

    // The card's top, where the cheer is written and the trophy stands: every doodle keeps to the sides, clear of
    // the cheer's line and the trophy's circle, inside the card's padding box
    it("should keep the doodles round the cheer and the trophy, clear of both", () => {
        const doodles = mount(ChalkboardCardDecoration, { props: { still: false } }).get(".chalkboard-doodles");
        const [, , width = 0, height = 0] = (doodles.attributes("viewBox") ?? "").split(/\s+/).map(Number);
        const centre = width / 2;
        const cheer = { left: centre - 80, right: centre + 80, top: 18, bottom: 64 };
        const trophy = { left: centre - 44, right: centre + 44, top: 76, bottom: 166 };
        const overlaps = (box: Box, area: Box) => box.left < area.right && box.right > area.left && box.top < area.bottom && box.bottom > area.top;

        for (const doodle of doodles.findAll(".chalkboard-doodle")) {
            const box = boxOf(doodle.attributes("d") ?? "");
            expect(box.left, doodle.attributes("d")).toBeGreaterThanOrEqual(0);
            expect(box.right, doodle.attributes("d")).toBeLessThanOrEqual(width);
            expect(box.top, doodle.attributes("d")).toBeGreaterThanOrEqual(0);
            expect(box.bottom, doodle.attributes("d")).toBeLessThanOrEqual(height);
            expect(overlaps(box, cheer), doodle.attributes("d")).toBe(false);
            expect(overlaps(box, trophy), doodle.attributes("d")).toBe(false);
        }
    });

    it("should leave the doodles drawn on a still card", () => {
        const wrapper = mount(ChalkboardCardDecoration, { props: { still: true } });

        expect(wrapper.findAll(".chalkboard-doodle")).toHaveLength(4);
    });

    // A still card is not written: the whole cheer is there at once, so there is no dust to drop
    it("should show the whole cheer at once, without dust, when still", () => {
        const wrapper = mount(ChalkboardCardDecoration, { props: { still: true } });

        expect(wrapper.get(".chalkboard-cheer-text").text()).toBe(i18n.global.t("game.complete.cheer"));
        expect(wrapper.find(".chalkboard-cheer-dust").exists()).toBe(false);
    });
});
