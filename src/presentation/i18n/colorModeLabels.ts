import { useI18n } from "vue-i18n";
import { STYLE_MODE_NAMES, type ColorMode, type StyleId } from "@/theme/themeIds";

/** A mode's name for a style: the style's own when it names its modes, else the shared Light / Dark. */
export const useColorModeLabel = (): ((style: StyleId, mode: ColorMode) => string) => {
    const { t } = useI18n();
    return (style, mode) => STYLE_MODE_NAMES[style]
        ? t(`settings.colorMode.styled.${style}.${mode}`)
        : t(`settings.colorMode.${mode}`);
};
