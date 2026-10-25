import { mount } from "@vue/test-utils";
import PageHeader from "@/presentation/components/page-header/PageHeader.vue";

describe("PageHeader", () => {
    it("should show the page title", () => {
        const wrapper = mount(PageHeader, { props: { title: "Appearance" } });

        expect(wrapper.text()).toContain("Appearance");
    });

    it("should emit back when Back is pressed", async () => {
        const wrapper = mount(PageHeader, { props: { title: "Appearance" } });

        await wrapper.get("[data-testid='back-button']").trigger("click");

        expect(wrapper.emitted("back")).toHaveLength(1);
    });

    it("should let a page name its Back button", () => {
        const wrapper = mount(PageHeader, { props: { title: "Statistics", backTestId: "stats-back-button" } });

        expect(wrapper.find("[data-testid='stats-back-button']").exists()).toBe(true);
    });
});

describe("PageHeader width", () => {
    it("should run across the page gutter, so cards scrolling under it stay hidden", () => {
        const wrapper = mount(PageHeader, { props: { title: "Settings" } });

        expect(wrapper.get("[data-skin='page-header']").classes()).toEqual(expect.arrayContaining(["-mx-5", "px-5"]));
    });
});
