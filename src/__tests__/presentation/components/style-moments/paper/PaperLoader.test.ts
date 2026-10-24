import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import PaperLoader from "@/presentation/components/style-moments/paper/PaperLoader.vue";
import PaperCelebration from "@/presentation/components/style-moments/paper/PaperCelebration.vue";
import PaperGroupOverlay from "@/presentation/components/style-moments/paper/PaperGroupOverlay.vue";

describe("PaperLoader", () => {
    afterEach(() => {
        i18n.global.locale.value = "en";
    });

    it("should be paper's loader, stamp the card itself and draw pencil marks over the board", () => {
        expect(STYLE_MOMENTS.paper.loader).toBe(PaperLoader);
        expect(STYLE_MOMENTS.paper.celebration).toBeNull();
        expect(STYLE_MOMENTS.paper.cardDecoration).toBe(PaperCelebration);
        expect(STYLE_MOMENTS.paper.groupOverlay).toBe(PaperGroupOverlay);
    });

    it("should sketch a grid of four strokes and four digits on the note, as decoration", () => {
        const wrapper = mount(PaperLoader);

        expect(wrapper.findAll(".paper-loader-line")).toHaveLength(4);
        expect(wrapper.findAll(".paper-loader-digit").map(digit => digit.text())).toEqual(["5", "9", "1", "7"]);
        expect(wrapper.get(".paper-loader-sketch").attributes("aria-hidden")).toBe("true");
    });

    it("should caption the note in the current language", async () => {
        const wrapper = mount(PaperLoader);
        const caption = wrapper.get(".paper-loader p");
        const english = caption.text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(caption.text()).not.toBe(english);
        expect(caption.text()).not.toBe("");
    });

    it("should show a screen's own message instead", () => {
        const wrapper = mount(PaperLoader, { props: { message: "Checking…" } });

        expect(wrapper.get(".paper-loader p").text()).toBe("Checking…");
    });
});
