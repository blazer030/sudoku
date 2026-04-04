import { ref } from "vue";
import { defineStore } from "pinia";
import { loadSettings, saveSettings, type ThemeId } from "@/application/SettingsStorage";

export const useSettingsStore = defineStore("settings", () => {
    const settings = loadSettings();
    const theme = ref<ThemeId>(settings.theme);

    const setTheme = (id: ThemeId) => {
        theme.value = id;
        saveSettings({ theme: id });
    };

    return { theme, setTheme };
});
