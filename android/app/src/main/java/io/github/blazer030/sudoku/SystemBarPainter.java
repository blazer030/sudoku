package io.github.blazer030.sudoku;

import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

/**
 * Below API 35 the app is not drawn under the system bars, which keep their own colours
 * (a grey status bar, a black navigation bar). Paint them in the page background instead,
 * with icons that read on it. From API 35 the page already shows under the bars.
 */
final class SystemBarPainter {

    /** The colours last painted, for repainting after something else resets the bars. */
    private static AppearanceStore.SystemBarColors lastPainted;

    private SystemBarPainter() {}

    static boolean paintsBars() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM;
    }

    @SuppressWarnings("deprecation") // setStatusBarColor and setNavigationBarColor only run below API 35
    static void paint(Activity activity, AppearanceStore.SystemBarColors colors) {
        if (!paintsBars()) return;
        lastPainted = colors;

        Window window = activity.getWindow();
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS | WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

        window.setStatusBarColor(colors.background());
        controller.setAppearanceLightStatusBars(colors.darkIcons());

        // Dark navigation bar icons arrived in API 26; before that a light bar would hide its white icons
        boolean navigationBarCanTakeBackground = !colors.darkIcons() || Build.VERSION.SDK_INT >= Build.VERSION_CODES.O;
        window.setNavigationBarColor(navigationBarCanTakeBackground ? colors.background() : Color.BLACK);
        controller.setAppearanceLightNavigationBars(navigationBarCanTakeBackground && colors.darkIcons());
    }

    /** Paints the last colours again, if any were painted. */
    static void repaint(Activity activity) {
        if (lastPainted != null) paint(activity, lastPainted);
    }
}
