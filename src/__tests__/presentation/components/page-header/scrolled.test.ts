import { mount } from "@vue/test-utils";
import PageHeader from "@/presentation/components/page-header/PageHeader.vue";
import { HEADER_FADE_DISTANCE } from "@/presentation/composables/useScrolledHeader";
import { defineComponent, h } from "vue";

const Page = defineComponent({
    setup: () => () => h("div", { class: "scroller", style: "overflow-y: auto" }, [h(PageHeader, { title: "Settings" })]),
});

let pendingFrames: FrameRequestCallback[] = [];

const runFrames = async () => {
    const frames = pendingFrames;
    pendingFrames = [];
    frames.forEach((frame) => { frame(0); });
    await Promise.resolve();
};

const scrollTo = async (scroller: Element, top: number) => {
    scroller.scrollTop = top;
    scroller.dispatchEvent(new Event("scroll"));
    await runFrames();
};

const progressOf = (wrapper: ReturnType<typeof mount>) =>
    (wrapper.get("[data-skin='page-header']").element as HTMLElement).style.getPropertyValue("--header-scroll");

describe("PageHeader scrolled hook", () => {
    beforeEach(() => {
        pendingFrames = [];
        vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => pendingFrames.push(callback));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should write how far the frost has faded in as --header-scroll, from 0 at the top to 1 past the fade distance", async () => {
        const wrapper = mount(Page, { attachTo: document.body });
        const scroller = wrapper.get(".scroller").element;

        expect(progressOf(wrapper)).toBe("0");
        await scrollTo(scroller, HEADER_FADE_DISTANCE / 2);
        expect(progressOf(wrapper)).toBe("0.5");
        await scrollTo(scroller, HEADER_FADE_DISTANCE * 3);
        expect(progressOf(wrapper)).toBe("1");
        await scrollTo(scroller, 0);
        expect(progressOf(wrapper)).toBe("0");
        wrapper.unmount();
    });

    it("should read the scroll position once per frame, not once per scroll event", async () => {
        const wrapper = mount(Page, { attachTo: document.body });
        const scroller = wrapper.get(".scroller").element;

        scroller.scrollTop = 16;
        scroller.dispatchEvent(new Event("scroll"));
        scroller.scrollTop = 32;
        scroller.dispatchEvent(new Event("scroll"));

        expect(pendingFrames).toHaveLength(1);
        await runFrames();
        expect(progressOf(wrapper)).toBe("0.5");
        wrapper.unmount();
    });

    it("should cancel a pending frame when unmounted", () => {
        const cancel = vi.spyOn(window, "cancelAnimationFrame");
        vi.mocked(window.requestAnimationFrame).mockImplementation(() => 7);
        const wrapper = mount(Page, { attachTo: document.body });
        wrapper.get(".scroller").element.dispatchEvent(new Event("scroll"));

        wrapper.unmount();

        expect(cancel).toHaveBeenCalledWith(7);
    });

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
