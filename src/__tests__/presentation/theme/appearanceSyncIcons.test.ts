import { nextTick, ref } from "vue";
import { startAppearanceSync } from "@/presentation/theme/appearanceSync";
import { selectIconStyle } from "@/presentation/components/icon/activeIconSet";
import type { ColorMode, ColorThemeId, StyleId } from "@/theme/themeIds";
import type { SystemBarService } from "@/application/systemBar/SystemBarService";
import type { AppearanceBridgeService } from "@/application/appearanceBridge/AppearanceBridgeService";

vi.mock("@/presentation/components/icon/activeIconSet", () => ({
    selectIconStyle: vi.fn(() => Promise.resolve()),
}));

describe("startAppearanceSync icons", () => {
    let stop: (() => void) | undefined;

    const start = (style: StyleId) => {
        const sources = {
            appearance: ref<ColorMode>("light"),
            style: ref<StyleId>(style),
            colorTheme: ref<ColorThemeId>("green"),
        };
        const systemBar = { apply: () => Promise.resolve() } as unknown as SystemBarService;
        const bridge = {
            setAppearance: () => Promise.resolve(),
            setSystemBarColors: () => Promise.resolve(),
        } as unknown as AppearanceBridgeService;
        stop = startAppearanceSync(sources, systemBar, bridge);
        return sources;
    };

    afterEach(() => {
        stop?.();
        vi.mocked(selectIconStyle).mockClear();
    });

    it("should start the icons on the current style", () => {
        start("pixel");

        expect(selectIconStyle).toHaveBeenLastCalledWith("pixel");
    });

    it("should move the icons when the style changes", async () => {
        const sources = start("minimal");

        sources.style.value = "pixel";
        await nextTick();

        expect(selectIconStyle).toHaveBeenLastCalledWith("pixel");
    });
});
