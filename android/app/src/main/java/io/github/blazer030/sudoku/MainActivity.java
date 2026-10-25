package io.github.blazer030.sudoku;

import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatDelegate;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final long SPLASH_FADE_MILLISECONDS = 200;

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

        // Repaint the bars from last time until the page sets them again, unless the system theme
        // changed while the app was closed and they would be the wrong way round
        AppearanceStore.SystemBarColors systemBarColors = AppearanceStore.loadSystemBarColors(this);
        int nightFlag = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        boolean isNight = nightFlag == Configuration.UI_MODE_NIGHT_YES;
        if (systemBarColors != null && systemBarColors.darkIcons() != isNight) {
            SystemBarPainter.paint(this, systemBarColors);
        }

        // From API 31 the system splash screen sets the bar icons back to the theme's light ones
        // as it leaves, so fade it out ourselves, as the system would, and paint the bars again
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && SystemBarPainter.paintsBars()) {
            getSplashScreen().setOnExitAnimationListener(splashScreenView ->
                splashScreenView
                    .animate()
                    .alpha(0f)
                    .setDuration(SPLASH_FADE_MILLISECONDS)
                    .withEndAction(() -> {
                        splashScreenView.remove();
                        SystemBarPainter.repaint(this);
                    })
                    .start()
            );
        }
    }
}
