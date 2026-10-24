import { mount } from "@vue/test-utils";
import PageHeader from "@/presentation/components/page-header/PageHeader.vue";
import { defineComponent, h } from "vue";

const Page = defineComponent({
    setup: () => () => h("div", { class: "scroller", style: "overflow-y: auto" }, [h(PageHeader, { title: "Settings" })]),
});

const scrollTo = async (scroller: Element, top: number) => {
    scroller.scrollTop = top;
    scroller.dispatchEvent(new Event("scroll"));
    await Promise.resolve();
};

describe("PageHeader scrolled hook", () => {
    it("should carry no data-scrolled at the top of its scroller", () => {
        const wrapper = mount(Page, { attachTo: document.body });

        expect(wrapper.get("[data-skin='page-header']").attributes("data-scrolled")).toBeUndefined();
        wrapper.unmount();
    });

    it("should carry data-scrolled once its scroller has scrolled, and drop it back at the top", async () => {
        const wrapper = mount(Page, { attachTo: document.body });
        const scroller = wrapper.get(".scroller").element;

        await scrollTo(scroller, 40);
        expect(wrapper.get("[data-skin='page-header']").attributes("data-scrolled")).toBeDefined();

        await scrollTo(scroller, 0);
        expect(wrapper.get("[data-skin='page-header']").attributes("data-scrolled")).toBeUndefined();
        wrapper.unmount();
    });

    it("should stop listening to its scroller when unmounted", () => {
        const wrapper = mount(Page, { attachTo: document.body });
        const scroller = wrapper.get(".scroller").element;
        const remove = vi.spyOn(scroller, "removeEventListener");

        wrapper.unmount();

        expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
    });
});
