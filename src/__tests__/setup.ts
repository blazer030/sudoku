import { vi } from "vitest";
import { config, enableAutoUnmount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;

vi.mock("vue3-lottie", () => ({
    Vue3Lottie: {
        name: "Vue3Lottie",
        props: ["animationData", "height", "width", "loop", "autoPlay"],
        template: "<div data-testid='lottie-stub' />",
    },
}));

config.global.plugins.push(i18n);
// A mounted page left alive keeps re-rendering on every later locale switch and keeps its listeners
enableAutoUnmount(afterEach);

afterEach(() => {
    i18n.global.locale.value = "en";
    document.documentElement.lang = "";
});
