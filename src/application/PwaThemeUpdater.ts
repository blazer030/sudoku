import { THEMES } from "@/theme/themeConfig";
import type { ColorThemeId } from "@/application/SettingsStorage";

const getPrimary = (id: ColorThemeId): string =>
    THEMES.find((t) => t.id === id)!.primary;

export const updateMetaThemeColor = (id: ColorThemeId): void => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = getPrimary(id);
};

export const updateFavicon = (id: ColorThemeId): void => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) link.href = `${import.meta.env.BASE_URL}sudoku-${id}.svg`;
};
