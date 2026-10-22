import type { LauncherIconKey } from "@/theme/launcherIcon";

export const updateMetaThemeColor = (color: string): void => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = color;
};

// The files are drawn by scripts/generate-pwa-icons.ts, one set per icon key
export const updateFavicon = (icon: LauncherIconKey): void => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) link.href = `${import.meta.env.BASE_URL}sudoku-${icon}.svg`;
};

export const updateManifestLink = (icon: LauncherIconKey): void => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (link) link.href = `${import.meta.env.BASE_URL}manifest-${icon}.webmanifest`;
};

export const updateAppleTouchIcon = (icon: LauncherIconKey): void => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (link) link.href = `${import.meta.env.BASE_URL}apple-touch-icon-${icon}.png`;
};
