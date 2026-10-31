package io.github.blazer030.sudoku;

import android.content.res.Configuration;
import android.graphics.Point;
import android.graphics.Rect;
import android.os.Build;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatDelegate;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // First, before the window and the WebView are set up, so a phone held sideways at launch turns
        // to portrait at once rather than after the page has loaded. The splash window the system shows
        // before the app runs follows how the device is held; no code of the app's runs early enough.
        followDisplaySize();
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
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // A foldable unfolding or folding changes the display without recreating the activity
        followDisplaySize();
    }

    // Phones and a foldable's outer screen stay in portrait; large screens turn freely. Set here, not in
    // the manifest, so the lock follows the display in use (Android 16 ignores it on large screens anyway).
    // Judged by the display, not the window: once letterboxed, the app's own window is narrow and would
    // keep the lock on after an unfold, or in a stacked split on a tablet.
    private void followDisplaySize() {
        int orientation = OrientationPolicy.requestedOrientation(displaySmallestWidthDp());
        if (getRequestedOrientation() != orientation) setRequestedOrientation(orientation);
    }

    @SuppressWarnings("deprecation")
    private int displaySmallestWidthDp() {
        float density = getResources().getDisplayMetrics().density;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Rect bounds = getWindowManager().getMaximumWindowMetrics().getBounds();
            return OrientationPolicy.smallestWidthDp(bounds.width(), bounds.height(), density);
        }
        Point realSize = new Point();
        getWindowManager().getDefaultDisplay().getRealSize(realSize);
        return OrientationPolicy.smallestWidthDp(realSize.x, realSize.y, density);
    }
}
