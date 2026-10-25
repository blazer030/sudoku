import { defineComponent, h, nextTick } from "vue";
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
        const rendered = wrapper.get("svg").element.outerHTML;
        // An icon with ids carries this instance's own suffix
        host.innerHTML = styleIconSvg(styleId, palette, /id="(?:cyber-edge|ink-rough)-([^"]+)"/.exec(rendered)?.[1]);
        expect(rendered).toBe(host.innerHTML.trim());
    });

    it("should keep the ids of two cyber icons on one page apart", () => {
        const palette = getPalette("cyber", "neon", "dark");
        const props = { styleId: "cyber", palette, size: 48 } as const;
        const page = mount(defineComponent({ render: () => h("div", [h(StyleIcon, props), h(StyleIcon, props)]) }));
        const ids = [...page.html().matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);

        expect(ids).toHaveLength(4);
        expect(new Set(ids).size).toBe(4);
    });

    it("should be an image sized by the size prop", () => {
        const { wrapper } = mountIcon("minimal", 64);

        expect(wrapper.attributes("role")).toBe("img");
        expect(wrapper.attributes("style")).toContain("64px");
    });

    it("should hide from screen readers when decorative, as a visible name beside it already says it", () => {
        const palette = getPalette("tactile", STYLES.tactile.themes[0].id, "light");
        const wrapper = mount(StyleIcon, { props: { styleId: "tactile", palette, size: 48, decorative: true } });

        expect(wrapper.attributes("aria-hidden")).toBe("true");
        expect(wrapper.attributes("role")).toBeUndefined();
        expect(wrapper.attributes("aria-label")).toBeUndefined();
        expect(wrapper.find("svg").exists()).toBe(true);
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
