import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import StyleIcon from "@/presentation/components/style-icon/StyleIcon.vue";
import { i18n } from "@/presentation/i18n";
import { STYLES, getPalette } from "@/theme/palettes";
import { styleIconSvg } from "@/theme/styleIcons";
import { STYLE_IDS } from "@/theme/themeIds";

const mountIcon = (styleId: (typeof STYLE_IDS)[number], size = 48) => {
    const palette = getPalette(styleId, STYLES[styleId].themes[0].id, "light");
    return { palette, wrapper: mount(StyleIcon, { props: { styleId, palette, size } }) };
};

describe("StyleIcon", () => {
    it.each(STYLE_IDS)("should draw the %s style's app icon", (styleId) => {
        const { palette, wrapper } = mountIcon(styleId);

        expect(wrapper.find(`[data-testid='style-icon-${styleId}']`).exists()).toBe(true);
        const host = document.createElement("div");
        host.innerHTML = styleIconSvg(styleId, palette);
        expect(wrapper.get("svg").element.outerHTML).toBe(host.innerHTML.trim());
    });

    it("should be an image sized by the size prop", () => {
        const { wrapper } = mountIcon("minimal", 64);

        expect(wrapper.attributes("role")).toBe("img");
        expect(wrapper.attributes("style")).toContain("64px");
    });

    it("should follow the locale for its label", async () => {
        const { wrapper } = mountIcon("minimal");
        const english = wrapper.attributes("aria-label");
        expect(english).toBeTruthy();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();
        expect(wrapper.attributes("aria-label")).toBeTruthy();
        expect(wrapper.attributes("aria-label")).not.toBe(english);
        i18n.global.locale.value = "en";
    });
});
