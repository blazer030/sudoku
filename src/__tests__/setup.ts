import { vi } from "vitest";

HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;

vi.mock("vue3-lottie", () => ({
    Vue3Lottie: {
        name: "Vue3Lottie",
        props: ["animationData", "height", "width", "loop", "autoPlay"],
        template: "<div data-testid='lottie-stub' />",
    },
}));
