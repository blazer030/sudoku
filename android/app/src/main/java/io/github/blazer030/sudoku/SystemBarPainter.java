package io.github.blazer030.sudoku;

import android.os.Build;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

/**
 * The page runs edge to edge on every API level, under the status bar and gesture navigation's handle,
 * and keeps its content clear of them by the safe-area insets. A button navigation bar's keys would cover
 * what a style draws at the page's edge, so the page ends at that bar instead. The bars are transparent
 * through the app theme (styles.xml), not through the Window bar-colour setters Android 15 deprecated;
 * their icons follow the page's mode.
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
     * Pads the window's content frame by a button navigation bar, on whichever side it sits, and passes
     * the insets on without it. Capacitor's SystemBars listens on the WebView's frame inside, so it neither
     * pads by the bar again nor gives the page a safe-area inset for it. Re-run on every inset change, so
     * switching navigation mode or turning the device follows at once.
     */
    static void keepClearOfButtonNavigationBar(Window window) {
        ViewCompat.setOnApplyWindowInsetsListener(window.findViewById(android.R.id.content), (contentView, insets) -> {
            NavigationBarPolicy.Edges reserved = NavigationBarPolicy.reservedEdges(
                edges(insets.getInsets(WindowInsetsCompat.Type.tappableElement())),
                edges(insets.getInsets(WindowInsetsCompat.Type.navigationBars()))
            );
            contentView.setPadding(reserved.left(), 0, reserved.right(), reserved.bottom());
            return insets.inset(reserved.left(), 0, reserved.right(), reserved.bottom());
        });
    }

    private static NavigationBarPolicy.Edges edges(Insets insets) {
        return new NavigationBarPolicy.Edges(insets.left, insets.right, insets.bottom);
    }

    /**
     * Icons that read on the page, and the page background on the window's content frame, which shows
     * wherever the page does not reach: under a button navigation bar, and under both bars on WebViews
     * before 140, where Capacitor pads its frame by them instead of passing the insets to the page. Not the
     * decor view: Capacitor's SystemBars repaints it whenever the page sets the bar style.
     */
    static void paint(Window window, AppearanceStore.SystemBarColors colors) {
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        controller.setAppearanceLightStatusBars(colors.darkIcons());
        // Below API 26 the navigation bar keeps white icons, over the theme's dark scrim
        controller.setAppearanceLightNavigationBars(colors.darkIcons());
        window.findViewById(android.R.id.content).setBackgroundColor(colors.background());
    }
}
