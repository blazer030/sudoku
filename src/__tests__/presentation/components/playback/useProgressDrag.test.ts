import { defineComponent, ref } from "vue";
import { mount } from "@vue/test-utils";
import { useProgressDrag } from "@/presentation/components/playback/useProgressDrag";

type DragApi = ReturnType<typeof useProgressDrag>;

// A 200px bar from x = 100 over ten steps, so each step is 20px
const mountDrag = (playing: boolean) => {
    const bar = document.createElement("div");
    bar.getBoundingClientRect = () => ({ left: 100, width: 200, top: 0, right: 300, bottom: 10, height: 10, x: 100, y: 0, toJSON: () => ({}) });
    const isPlaying = ref(playing);
    const playState = {
        isPlaying,
        stopPlay: vi.fn(() => { isPlaying.value = false; }),
        startPlay: vi.fn(() => { isPlaying.value = true; }),
    };
    const onSeek = vi.fn();
    let api!: DragApi;
    mount(defineComponent({
        setup() {
            api = useProgressDrag(ref(bar), ref(10), onSeek, playState);
            return () => null;
        },
    }));
    return { api, onSeek, playState };
};

const mouseAt = (type: string, clientX: number) => new MouseEvent(type, { clientX });
const touchAt = (type: string, clientX: number) => {
    const event = new Event(type) as TouchEvent;
    Object.defineProperty(event, "touches", { value: [{ clientX }] });
    return event;
};

describe("useProgressDrag", () => {
    it("should seek to the step under the pointer, held to the bar's ends", () => {
        const { api, onSeek } = mountDrag(false);

        api.onPointerDown(mouseAt("mousedown", 160));
        window.dispatchEvent(mouseAt("mousemove", 50));
        window.dispatchEvent(mouseAt("mousemove", 400));

        expect(onSeek.mock.calls.map(([step]) => step as number)).toEqual([3, 0, 10]);
    });

    it("should pause playback while dragging and resume it on release", () => {
        const { api, playState } = mountDrag(true);

        api.onPointerDown(mouseAt("mousedown", 160));
        expect(playState.stopPlay).toHaveBeenCalledTimes(1);
        expect(api.isDragging.value).toBe(true);

        window.dispatchEvent(mouseAt("mouseup", 160));
        expect(playState.startPlay).toHaveBeenCalledTimes(1);
        expect(api.isDragging.value).toBe(false);
    });

    it("should stop following the pointer after release", () => {
        const { api, onSeek } = mountDrag(false);

        api.onPointerDown(mouseAt("mousedown", 160));
        window.dispatchEvent(mouseAt("mouseup", 160));
        window.dispatchEvent(mouseAt("mousemove", 300));

        expect(onSeek).toHaveBeenCalledTimes(1);
    });

    // A second finger used to reset the paused state, so playback never resumed
    it("should resume playback after a drag a second finger joined", () => {
        const { api, playState } = mountDrag(true);

        api.onPointerDown(touchAt("touchstart", 160));
        api.onPointerDown(touchAt("touchstart", 200));
        window.dispatchEvent(touchAt("touchend", 200));

        expect(playState.startPlay).toHaveBeenCalledTimes(1);
    });
});
