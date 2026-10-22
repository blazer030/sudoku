import type { ColorMode, IconThemeId } from "@/application/SettingsStorage";

export const updateMetaThemeColor = (color: string): void => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = color;
};

// Dark mode gets the dark palette's lighter icon, drawn by scripts/generate-pwa-icons.ts
export const updateFavicon = (iconTheme: IconThemeId, mode: ColorMode): void => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) link.href = `${import.meta.env.BASE_URL}sudoku-${iconTheme}${mode === "dark" ? "-dark" : ""}.svg`;
};

export const updateManifestLink = (iconTheme: IconThemeId): void => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (link) link.href = `${import.meta.env.BASE_URL}manifest-${iconTheme}.webmanifest`;
};

export const updateAppleTouchIcon = (iconTheme: IconThemeId): void => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (link) link.href = `${import.meta.env.BASE_URL}apple-touch-icon-${iconTheme}.png`;
};
