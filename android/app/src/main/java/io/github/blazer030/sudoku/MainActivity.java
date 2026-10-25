package io.github.blazer030.sudoku;

import android.os.Build;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatDelegate;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppearanceBridgePlugin.class);
        // Before the window is set up, so its background follows the app's appearance, not the system's.
        // From API 31 the system keeps the per-app night mode itself (see AppearanceBridgePlugin), and
        // AppCompat's default would override a later switch back to "system".
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            AppCompatDelegate.setDefaultNightMode(AppearanceStore.appCompatNightMode(AppearanceStore.loadMode(this)));
        }
        super.onCreate(savedInstanceState);

        // Repaint the bars from last time until the page sets them again
        AppearanceStore.SystemBarColors systemBarColors = AppearanceStore.loadSystemBarColors(this);
        if (systemBarColors != null && AppearanceStore.restoresOnStart(systemBarColors, AppearanceStore.isNight(this))) {
            SystemBarPainter.paint(this, systemBarColors);
        }
    }
}
