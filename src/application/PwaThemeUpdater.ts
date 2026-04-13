import { THEMES } from "@/theme/themeConfig";
import type { ColorThemeId } from "@/application/SettingsStorage";

const getPrimary = (id: ColorThemeId): string => {
    const theme = THEMES.find((t) => t.id === id);
    return theme ? theme.primary : "";
};

export const updateMetaThemeColor = (id: ColorThemeId): void => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = getPrimary(id);
};

export const updateFavicon = (id: ColorThemeId): void => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) link.href = `${import.meta.env.BASE_URL}sudoku-${id}.svg`;
};

export const updateManifestLink = (id: ColorThemeId): void => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (link) link.href = `${import.meta.env.BASE_URL}manifest-${id}.webmanifest`;
};

export const updateAppleTouchIcon = (id: ColorThemeId): void => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (link) link.href = `${import.meta.env.BASE_URL}apple-touch-icon-${id}.png`;
};
