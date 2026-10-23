import { createApp, defineComponent } from "vue";
import { i18n } from "@/presentation/i18n";
import { useColorModeLabel } from "@/presentation/i18n/colorModeLabels";

const labelsIn = (locale: "en" | "zh-Hant") => {
    i18n.global.locale.value = locale;
    let label: ReturnType<typeof useColorModeLabel> = () => "";
    const app = createApp(defineComponent({
        setup() {
            label = useColorModeLabel();
            return () => null;
        },
    }));
    app.use(i18n);
    app.mount(document.createElement("div"));
    app.unmount();
    return label;
};

describe("useColorModeLabel", () => {
    afterEach(() => {
        i18n.global.locale.value = "en";
    });

    it("should use the shared light and dark names for styles without their own", () => {
        const label = labelsIn("en");

        expect(label("minimal", "light")).toBe(i18n.global.t("settings.colorMode.light"));
        expect(label("paper", "light")).toBe(i18n.global.t("settings.colorMode.light"));
        expect(label("tactile", "dark")).toBe(i18n.global.t("settings.colorMode.dark"));
    });

    it("should use the style's own names when it names its modes", () => {
        const label = labelsIn("en");

        expect(label("pixel", "light")).toBe(i18n.global.t("settings.colorMode.styled.pixel.light"));
        expect(label("pixel", "dark")).toBe(i18n.global.t("settings.colorMode.styled.pixel.dark"));
        expect(label("pixel", "light")).not.toBe(label("minimal", "light"));
        expect(label("pixel", "dark")).not.toBe(label("minimal", "dark"));
    });

    it("should follow the language", () => {
        const english = labelsIn("en")("pixel", "dark");
        const chinese = labelsIn("zh-Hant")("pixel", "dark");

        expect(chinese).not.toBe(english);
    });
});
