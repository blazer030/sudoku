import { vi } from "vitest";
import { config } from "@vue/test-utils";
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

afterEach(() => {
    i18n.global.locale.value = "en";
});
