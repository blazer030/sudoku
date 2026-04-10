import type { ColorThemeId } from "@/application/SettingsStorage";

export interface ThemeDefinition {
    id: ColorThemeId;
    primary: string;
    accent: string;
}

export const THEMES: ThemeDefinition[] = [
    { id: "green",  primary: "#3D8A5A", accent: "#D89575" },
    { id: "blue",   primary: "#4A7AB5", accent: "#C49A5C" },
    { id: "purple", primary: "#7B5EA7", accent: "#5A9E8F" },
    { id: "orange", primary: "#C08040", accent: "#6888A5" },
    { id: "pink",   primary: "#B5607A", accent: "#5A9A8A" },
    { id: "teal",   primary: "#4A9A9A", accent: "#C07A6A" },
];
