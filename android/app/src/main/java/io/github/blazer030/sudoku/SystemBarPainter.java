package io.github.blazer030.sudoku;

import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

/**
 * The page runs edge to edge on every API level, under both system bars, and keeps its content clear of
 * them by the safe-area insets. The bars are transparent through the app theme (styles.xml), not through
 * the Window bar-colour setters Android 15 deprecated; their icons follow the page's mode.
 */
final class SystemBarPainter {

    private SystemBarPainter() {}

    /** From API 35 the system lays every app out this way; before it, the app opts in. */
    static void drawEdgeToEdge(Window window) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            WindowCompat.setDecorFitsSystemWindows(window, false);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            // Into a landscape cutout too, as on API 35; the safe-area insets cover it
            WindowManager.LayoutParams attributes = window.getAttributes();
            attributes.layoutInDisplayCutoutMode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                ? WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                : WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(attributes);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Otherwise three-button navigation gets a translucent scrim; its icons follow the page's mode
            window.setNavigationBarContrastEnforced(false);
        }
    }

    /**
     * Icons that read on the page, and the page background on the WebView's frame. On WebViews before 140
     * Capacitor pads that frame by the bars instead of passing the insets to the page, so the frame is what
     * shows under them. Not the decor view: Capacitor's SystemBars repaints it whenever the page sets the
     * bar style.
     */
    static void paint(Window window, WebView webView, AppearanceStore.SystemBarColors colors) {
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        controller.setAppearanceLightStatusBars(colors.darkIcons());
        // Below API 26 the navigation bar keeps white icons, over the theme's dark scrim
        controller.setAppearanceLightNavigationBars(colors.darkIcons());
        if (webView != null && webView.getParent() instanceof View) {
            ((View) webView.getParent()).setBackgroundColor(colors.background());
        }
    }
}
