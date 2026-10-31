import {
    COLOR_MODES, STYLE_COLOR_MODES, effectiveColorMode, STYLE_IDS, THEME_IDS_BY_STYLE,
    type ColorMode, type ColorThemeId, type RememberedAppearances, type RememberedThemes,
    type StyleId,
} from "@/theme/themeIds";

export const APP_LOCALES = ["en", "zh-Hant"] as const;
export const LANGUAGE_PREFERENCES = ["system", ...APP_LOCALES] as const;
export type AppLocale = typeof APP_LOCALES[number];
export type LanguagePreference = typeof LANGUAGE_PREFERENCES[number];

export interface Settings {
    colorTheme: ColorThemeId;
    highlightSameDigit: boolean;
    motionEffects: boolean;
    autoRemoveNotes: boolean;
    showRemainingCount: boolean;
    matchLauncherIconToTheme: boolean;
    language: LanguagePreference;
    appearance: ColorMode;
    style: StyleId;
    highlightScope: boolean;
    // The colour theme last chosen under each style, so switching styles comes back to it
    colorThemeByStyle: RememberedThemes;
    // The light or dark mode last chosen under each style; `appearance` is the current style's entry
    appearanceByStyle: RememberedAppearances;
}

// index.html's inline script reads these fields too (style, colorTheme, appearance) before first paint
const STORAGE_KEY = "sudoku-settings";

const DEFAULT_SETTINGS: Settings = {
    colorTheme: "green",
    highlightSameDigit: true,
    motionEffects: true,
    autoRemoveNotes: true,
    showRemainingCount: true,
    matchLauncherIconToTheme: false,
    language: "system",
    appearance: "light",
    style: "minimal",
    highlightScope: true,
    colorThemeByStyle: { minimal: "green" },
    appearanceByStyle: { minimal: "light" },
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const isThemeOf = (style: StyleId, theme: unknown): theme is ColorThemeId =>
    (THEME_IDS_BY_STYLE[style] as readonly unknown[]).includes(theme);

// Keeps only known style keys mapped to one of that style's own theme ids; anything else is dropped
const usableRememberedThemes = (stored: unknown): RememberedThemes => {
    const remembered: RememberedThemes = {};
    if (!isPlainObject(stored)) return remembered;
    for (const style of STYLE_IDS) {
        const theme = stored[style];
        if (isThemeOf(style, theme)) remembered[style] = theme;
    }
    return remembered;
};

// Keeps only known style keys mapped to one of that style's own modes; anything else is dropped
const usableRememberedAppearances = (stored: unknown): RememberedAppearances => {
    const remembered: RememberedAppearances = {};
    if (!isPlainObject(stored)) return remembered;
    for (const style of STYLE_IDS) {
        const mode = stored[style];
        if ((STYLE_COLOR_MODES[style] as readonly unknown[]).includes(mode)) remembered[style] = mode as ColorMode;
    }
    return remembered;
};

// The mode the system shows right now; old WebViews and jsdom may lack matchMedia and count as light
const systemColorMode = (): ColorMode =>
    typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

// Anything but a JSON object (unreadable text, the text "null", an array, a lone value) counts as
// nothing saved, so the app starts like a fresh install and saves readable settings over it
const readStoredSettings = (): Partial<Settings> => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return {};
    try {
        const parsed: unknown = JSON.parse(stored);
        return isPlainObject(parsed) ? parsed as Partial<Settings> : {};
    } catch {
        return {};
    }
};

export const loadSettings = (): Settings => {
    const parsed = readStoredSettings();
    // A fresh map every load, so a change to one result never leaks into the defaults
    const settings: Settings = { ...DEFAULT_SETTINGS, colorThemeByStyle: { ...DEFAULT_SETTINGS.colorThemeByStyle }, appearanceByStyle: {}, ...parsed };
    // A missing, retired "system" or unknown appearance becomes the system's current mode once, then is saved
    const appearanceChosen = (COLOR_MODES as readonly unknown[]).includes(parsed.appearance);
    if (!appearanceChosen) settings.appearance = systemColorMode();
    // A hand-edited unknown language falls back to following the system
    // The one-time long-press tip is gone; older saves may still carry its flag
    delete (settings as Partial<Record<"seenLongPressTip", unknown>>).seenLongPressTip;
    // 完成動畫 (completionFlash) became the general motion switch; its saved choice carries over
    const retired = settings as Partial<Record<"completionFlash", unknown>>;
    if (!("motionEffects" in parsed) && typeof retired.completionFlash === "boolean") settings.motionEffects = retired.completionFlash;
    delete retired.completionFlash;
    if (!LANGUAGE_PREFERENCES.includes(settings.language)) settings.language = "system";
    // Unknown style or theme ids (hand-edited, or from a future version) fall back too
    if (!STYLE_IDS.includes(settings.style)) settings.style = "minimal";
    const remembered = usableRememberedThemes(settings.colorThemeByStyle);
    // A theme of another style (or an unknown one) falls back to the style's remembered theme, then its
    // first, the same rule as rememberedThemeFor; index.html's inline script mirrors it
    if (!isThemeOf(settings.style, settings.colorTheme)) {
        settings.colorTheme = remembered[settings.style] ?? THEME_IDS_BY_STYLE[settings.style][0];
    }
    // The current theme is the truth for the current style, which also seeds settings saved before the map existed
    settings.colorThemeByStyle = { ...remembered, [settings.style]: settings.colorTheme };
    // Before the map, one appearance served every style, kept even through a style with one mode only: each style
    // the player had already chosen keeps it, and a style they never chose starts on its first mode
    const savedBeforeTheMap = !("appearanceByStyle" in parsed);
    const carriedOver: RememberedAppearances = savedBeforeTheMap
        ? Object.fromEntries(STYLE_IDS.filter(style => style in remembered).map(style => [style, effectiveColorMode(style, settings.appearance)]))
        : usableRememberedAppearances(settings.appearanceByStyle);
    // Likewise the current appearance is the truth for the current style (a style with one mode only holds that mode)
    settings.appearanceByStyle = {
        ...carriedOver,
        [settings.style]: effectiveColorMode(settings.style, settings.appearance),
    };
    if (!appearanceChosen) {
        // A failed save (quota, private mode) must not block startup; the migration just retries next launch
        try {
            saveSettings(settings);
        } catch {
            // keep the loaded settings
        }
    }
    return settings;
};

export const saveSettings = (settings: Settings): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
