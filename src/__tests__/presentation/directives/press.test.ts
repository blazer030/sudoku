import { defineComponent, h, withDirectives } from "vue";
import { mount } from "@vue/test-utils";
import { vPress, type PressFeedback } from "@/presentation/directives/press";

const mountPressable = (feedback?: PressFeedback, options: { disabled?: boolean; ariaDisabled?: boolean } = {}) => {
    const onClick = vi.fn();
    const Pressable = defineComponent({
        setup: () => () => withDirectives(
            h("button", {
                "data-testid": "pressable",
                disabled: options.disabled ?? false,
                "aria-disabled": options.ariaDisabled === true ? "true" : undefined,
                onClick,
            }),
            [[vPress, undefined, feedback]],
        ),
    });
    const wrapper = mount(Pressable, { attachTo: document.body });
    return { wrapper, button: wrapper.get<HTMLButtonElement>("[data-testid='pressable']"), onClick };
};

const stubReducedMotion = () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
    }));
};

const releaseOnWindow = (type: "pointerup" | "pointercancel" = "pointerup") => {
    window.dispatchEvent(new Event(type));
};

describe("vPress", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        document.body.innerHTML = "";
    });

    it("should add is-pressed and press-motion on pointerdown", async () => {
        const { button } = mountPressable();

        await button.trigger("pointerdown");

        expect(button.classes()).toContain("is-pressed");
        expect(button.classes()).toContain("press-motion");
    });

    it("should release when the pointer lifts outside the element", async () => {
        const { button } = mountPressable();
        await button.trigger("pointerdown");

        releaseOnWindow();

        expect(button.classes()).not.toContain("is-pressed");
    });

    it("should release on pointercancel", async () => {
        const { button } = mountPressable();
        await button.trigger("pointerdown");

        releaseOnWindow("pointercancel");

        expect(button.classes()).not.toContain("is-pressed");
    });

    it("should drop window listeners when unmounted mid-press", async () => {
        const { wrapper, button } = mountPressable();
        await button.trigger("pointerdown");
        const removeListener = vi.spyOn(window, "removeEventListener");

        wrapper.unmount();

        const removedTypes = removeListener.mock.calls.map(([type]) => type);
        expect(removedTypes).toContain("pointerup");
        expect(removedTypes).toContain("pointercancel");
    });

    it("should not add motion classes under reduced motion", async () => {
        stubReducedMotion();
        const { button } = mountPressable("bounce");

        await button.trigger("pointerdown");

        expect(button.classes()).toContain("is-pressed");
        expect(button.classes()).not.toContain("press-motion");
        releaseOnWindow();
        expect(button.classes()).not.toContain("press-bounce-release");
    });

    it("should add press-bounce-release on release and clear it on animationend", async () => {
        const { button } = mountPressable("bounce");
        await button.trigger("pointerdown");

        releaseOnWindow();
        expect(button.classes()).toContain("press-bounce-release");

        button.element.dispatchEvent(new Event("animationend"));
        expect(button.classes()).not.toContain("press-bounce-release");
    });

    it("should never add press-motion for tint", async () => {
        const { button } = mountPressable("tint");

        await button.trigger("pointerdown");

        expect(button.classes()).toContain("is-pressed");
        expect(button.classes()).not.toContain("press-motion");
    });

    it("should ignore a disabled button", async () => {
        const { button } = mountPressable("scale", { disabled: true });
        const { button: ariaDisabledButton } = mountPressable("scale", { ariaDisabled: true });

        button.element.dispatchEvent(new Event("pointerdown"));
        await ariaDisabledButton.trigger("pointerdown");

        expect(button.classes()).not.toContain("is-pressed");
        expect(ariaDisabledButton.classes()).not.toContain("is-pressed");
    });

    it("should call the click handler without waiting for the animation", async () => {
        const { button, onClick } = mountPressable("bounce");

        await button.trigger("pointerdown");
        button.element.click();

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should press without matchMedia", async () => {
        vi.stubGlobal("matchMedia", undefined);
        const { button } = mountPressable();

        await button.trigger("pointerdown");

        expect(button.classes()).toContain("is-pressed");
    });
});
