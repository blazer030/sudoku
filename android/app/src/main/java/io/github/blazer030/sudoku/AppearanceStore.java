package io.github.blazer030.sudoku;

import android.app.UiModeManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import androidx.appcompat.app.AppCompatDelegate;

/**
 * Remembers the app's appearance natively, so the next cold start can apply it before the
 * web page loads: the splash screen and window background then match the app, not the system.
 */
final class AppearanceStore {

    static final String MODE_SYSTEM = "system";
    static final String MODE_LIGHT = "light";
    static final String MODE_DARK = "dark";

    private static final String PREFERENCES_NAME = "appearance";
    private static final String KEY_MODE = "mode";
    private static final String KEY_BAR_BACKGROUND = "systemBarBackground";
    private static final String KEY_BAR_DARK_ICONS = "systemBarDarkIcons";
    private static final String KEY_BAR_SAVED_AT_NIGHT = "systemBarSavedAtNight";

    private AppearanceStore() {}

    /** The system bar colours last set by the page, and whether the app was in night mode then. */
    record SystemBarColors(int background, boolean darkIcons, boolean savedAtNight) {}

    static boolean isMode(String mode) {
        return MODE_SYSTEM.equals(mode) || MODE_LIGHT.equals(mode) || MODE_DARK.equals(mode);
    }

    static void saveMode(Context context, String mode) {
        preferences(context).edit().putString(KEY_MODE, mode).commit();
    }

    static String loadMode(Context context) {
        String mode = preferences(context).getString(KEY_MODE, MODE_SYSTEM);
        return isMode(mode) ? mode : MODE_SYSTEM;
    }

    static int appCompatNightMode(String mode) {
        return switch (mode) {
            case MODE_LIGHT -> AppCompatDelegate.MODE_NIGHT_NO;
            case MODE_DARK -> AppCompatDelegate.MODE_NIGHT_YES;
            default -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM;
        };
    }

    /** For UiModeManager.setApplicationNightMode (API 31+), where AUTO follows the system. */
    static int applicationNightMode(String mode) {
        return switch (mode) {
            case MODE_LIGHT -> UiModeManager.MODE_NIGHT_NO;
            case MODE_DARK -> UiModeManager.MODE_NIGHT_YES;
            default -> UiModeManager.MODE_NIGHT_AUTO;
        };
    }

    static void saveSystemBarColors(Context context, SystemBarColors colors) {
        preferences(context)
            .edit()
            .putInt(KEY_BAR_BACKGROUND, colors.background())
            .putBoolean(KEY_BAR_DARK_ICONS, colors.darkIcons())
            .putBoolean(KEY_BAR_SAVED_AT_NIGHT, colors.savedAtNight())
            .apply();
    }

    /** Null until the page has set them once. */
    static SystemBarColors loadSystemBarColors(Context context) {
        SharedPreferences preferences = preferences(context);
        if (!preferences.contains(KEY_BAR_BACKGROUND)) return null;
        boolean darkIcons = preferences.getBoolean(KEY_BAR_DARK_ICONS, true);
        // Colours saved before the night flag was kept: assume light bars were saved by day
        boolean savedAtNight = preferences.getBoolean(KEY_BAR_SAVED_AT_NIGHT, !darkIcons);
        return new SystemBarColors(preferences.getInt(KEY_BAR_BACKGROUND, 0), darkIcons, savedAtNight);
    }

    /**
     * Repaint the saved bars at start only in the night mode they were saved in: if the system theme
     * changed while the app was closed, the page may pick other bars. A style with one colour mode
     * keeps its bars in either, so the icons alone cannot tell.
     */
    static boolean restoresOnStart(SystemBarColors colors, boolean isNight) {
        return colors.savedAtNight() == isNight;
    }

    static boolean isNight(Context context) {
        int nightFlag = context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        return nightFlag == Configuration.UI_MODE_NIGHT_YES;
    }

    private static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
    }
}
