import { nextTick, ref } from "vue";
import { startAppearanceSync } from "@/presentation/theme/appearanceSync";
import { getPalette } from "@/theme/palettes";
import type { Appearance, ColorThemeId, StyleId } from "@/application/SettingsStorage";

describe("startAppearanceSync", () => {
    let stop: (() => void) | undefined;
    let meta: HTMLMetaElement;

    const buildSources = (colorTheme: ColorThemeId = "green", appearance: Appearance = "light") => ({
        appearance: ref<Appearance>(appearance),
        style: ref<StyleId>("minimal"),
        colorTheme: ref<ColorThemeId>(colorTheme),
    });

    beforeEach(() => {
        meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
    });

    afterEach(() => {
        stop?.();
        stop = undefined;
        meta.remove();
        document.documentElement.className = "";
        delete document.documentElement.dataset.style;
        delete document.documentElement.dataset.colorTheme;
    });

    it("should set data-color-theme on start", () => {
        stop = startAppearanceSync(buildSources());

        expect(document.documentElement.dataset.colorTheme).toBe("green");
    });

    it("should update data-color-theme and theme-color when the color theme changes", async () => {
        const sources = buildSources();
        stop = startAppearanceSync(sources);

        sources.colorTheme.value = "purple";
        await nextTick();

        expect(document.documentElement.dataset.colorTheme).toBe("purple");
        expect(meta.content).toBe(getPalette("minimal", "purple", "light").primary);
    });
});
