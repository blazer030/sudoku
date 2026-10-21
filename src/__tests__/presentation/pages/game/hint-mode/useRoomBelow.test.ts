import { defineComponent, h, onMounted, ref } from "vue";
import { mount } from "@vue/test-utils";
import { useRoomBelow } from "@/presentation/pages/game/hint-mode/useRoomBelow";

const measureRoomBelow = (elementTop: number, bottomGap: number): number | null => {
    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({ top: elementTop } as DOMRect);
    let measured: number | null = null;
    const wrapper = mount(defineComponent({
        setup: () => {
            const { room } = useRoomBelow(ref(element), bottomGap);
            // Registered after useRoomBelow's own onMounted, so the first measurement has run.
            onMounted(() => { measured = room.value; });
            return () => h("div");
        },
    }));
    wrapper.unmount();
    return measured;
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useRoomBelow", () => {
    it("should measure from the element's top down to the bottom gap", () => {
        expect(measureRoomBelow(window.innerHeight - 300, 16)).toBe(284);
    });

    it("should never report negative room when the element starts below the bottom gap", () => {
        expect(measureRoomBelow(window.innerHeight - 10, 16)).toBe(0);
    });
});
