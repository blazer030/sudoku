package io.github.blazer030.sudoku;

import android.app.UiModeManager;
import android.graphics.Color;
import android.os.Build;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Receives the app's appearance from the page; see src/infrastructure/appearanceBridge. */
@CapacitorPlugin(name = "AppearanceBridge")
public class AppearanceBridgePlugin extends Plugin {

    @PluginMethod
    public void setAppearance(PluginCall call) {
        String mode = call.getString("mode");
        if (!AppearanceStore.isMode(mode)) {
            call.reject("Unknown appearance mode: " + mode);
            return;
        }

        AppearanceStore.saveMode(getContext(), mode);
        // From API 31 the system draws the splash screen itself; this per-app night mode is what it reads
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            UiModeManager uiModeManager = getContext().getSystemService(UiModeManager.class);
            if (uiModeManager != null) {
                uiModeManager.setApplicationNightMode(AppearanceStore.applicationNightMode(mode));
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void setSystemBarColors(PluginCall call) {
        String background = call.getString("background");
        Boolean darkIcons = call.getBoolean("darkIcons");
        if (background == null || darkIcons == null) {
            call.reject("background and darkIcons are required");
            return;
        }

        AppearanceStore.SystemBarColors colors;
        try {
            colors = new AppearanceStore.SystemBarColors(Color.parseColor(background), darkIcons);
        } catch (IllegalArgumentException error) {
            call.reject("Unknown colour: " + background);
            return;
        }

        AppearanceStore.saveSystemBarColors(getContext(), colors);
        getBridge().executeOnMainThread(() -> {
            SystemBarPainter.paint(getActivity(), colors);
            call.resolve();
        });
    }
}
