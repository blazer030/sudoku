export const en = {
    common: {
        back: "Back",
        cancel: "Cancel",
    },
    settings: {
        title: "Settings",
        language: {
            label: "Language",
            system: "System",
            english: "English",
            traditionalChinese: "繁體中文",
        },
        appearance: "Appearance",
        colorTheme: "Color theme",
        matchLauncherIcon: "Match launcher icon to theme",
        matchLauncherIconNote: "App will briefly restart when changed",
        iconDialog: {
            message: "Changing the launcher icon will briefly restart the app. Enable?",
            enable: "Enable",
        },
        gameplay: "Gameplay",
        toggles: {
            highlightSameDigit: { label: "Highlight Same Numbers", description: "Highlight matching numbers and notes when selected" },
            completionFlash: { label: "Completion Animation", description: "Flash effect when completing a row, column, or box" },
            autoRemoveNotes: { label: "Auto-Remove Notes", description: "Remove notes from peers when placing a number" },
            showRemainingCount: { label: "Remaining Count", description: "Show remaining count on number buttons" },
        },
        support: "Support",
        donate: "Donate",
        about: "About",
        version: "Version",
    },
};

export type MessageSchema = typeof en;
