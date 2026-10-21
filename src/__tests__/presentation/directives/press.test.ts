import { defineComponent, h, nextTick, ref, withDirectives } from "vue";
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

    it("should mark the element pressed with motion on pointerdown", async () => {
        const { button } = mountPressable();

        await button.trigger("pointerdown");

        expect(button.attributes()).toHaveProperty("data-pressed");
        expect(button.attributes()).toHaveProperty("data-press-motion");
    });

    it("should release when the pointer lifts outside the element", async () => {
        const { button } = mountPressable();
        await button.trigger("pointerdown");

        releaseOnWindow();

        expect(button.attributes()).not.toHaveProperty("data-pressed");
    });

    it("should release on pointercancel", async () => {
        const { button } = mountPressable();
        await button.trigger("pointerdown");

        releaseOnWindow("pointercancel");

        expect(button.attributes()).not.toHaveProperty("data-pressed");
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

    it("should not add motion state under reduced motion", async () => {
        stubReducedMotion();
        const { button } = mountPressable("bounce");

        await button.trigger("pointerdown");

        expect(button.attributes()).toHaveProperty("data-pressed");
        expect(button.attributes()).not.toHaveProperty("data-press-motion");
        releaseOnWindow();
        expect(button.attributes()).not.toHaveProperty("data-press-bounce");
    });

    it("should bounce on release and clear it on animationend", async () => {
        const { button } = mountPressable("bounce");
        await button.trigger("pointerdown");

        releaseOnWindow();
        expect(button.attributes()).toHaveProperty("data-press-bounce");

        button.element.dispatchEvent(new Event("animationend"));
        expect(button.attributes()).not.toHaveProperty("data-press-bounce");
    });

    it("should never add motion for tint", async () => {
        const { button } = mountPressable("tint");

        await button.trigger("pointerdown");

        expect(button.attributes()).toHaveProperty("data-pressed");
        expect(button.attributes()).not.toHaveProperty("data-press-motion");
    });

    it("should ignore a disabled button", async () => {
        const { button } = mountPressable("scale", { disabled: true });
        const { button: ariaDisabledButton } = mountPressable("scale", { ariaDisabled: true });

        button.element.dispatchEvent(new Event("pointerdown"));
        await ariaDisabledButton.trigger("pointerdown");

        expect(button.attributes()).not.toHaveProperty("data-pressed");
        expect(ariaDisabledButton.attributes()).not.toHaveProperty("data-pressed");
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

        expect(button.attributes()).toHaveProperty("data-pressed");
    });
});

describe("vPress with a re-rendered class", () => {
    const mountReactive = (feedback: PressFeedback) => {
        const selected = ref(false);
        const Pressable = defineComponent({
            setup: () => () => withDirectives(
                h("button", {
                    "data-testid": "pressable",
                    class: selected.value ? "bg-primary" : "bg-card",
                    onClick: () => { selected.value = !selected.value; },
                }),
                [[vPress, undefined, feedback]],
            ),
        });
        const wrapper = mount(Pressable, { attachTo: document.body });
        return { wrapper, button: wrapper.get<HTMLButtonElement>("[data-testid='pressable']"), selected };
    };

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("should keep the release bounce when the click changes the element's class", async () => {
        const { button } = mountReactive("bounce");
        await button.trigger("pointerdown");
        window.dispatchEvent(new Event("pointerup"));

        button.element.click();
        await nextTick();

        expect(button.attributes()).toHaveProperty("data-press-bounce");
    });

    it("should stay pressed through a re-render while held", async () => {
        const { button, selected } = mountReactive("scale");
        await button.trigger("pointerdown");

        selected.value = true;
        await nextTick();

        expect(button.attributes()).toHaveProperty("data-pressed");
        expect(button.attributes()).toHaveProperty("data-press-motion");
        window.dispatchEvent(new Event("pointerup"));
    });
});
