package io.github.blazer030.sudoku;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatDelegate;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppearanceBridgePlugin.class);
        // Before the window is set up, so its background follows the app's appearance, not the system's
        AppCompatDelegate.setDefaultNightMode(AppearanceStore.appCompatNightMode(AppearanceStore.loadMode(this)));
        super.onCreate(savedInstanceState);

        // Repaint the bars from last time until the page sets them again
        AppearanceStore.SystemBarColors systemBarColors = AppearanceStore.loadSystemBarColors(this);
        if (systemBarColors != null) {
            SystemBarPainter.paint(this, systemBarColors);
        }
    }
}
