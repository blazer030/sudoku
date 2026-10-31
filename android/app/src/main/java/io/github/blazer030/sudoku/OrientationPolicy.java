package io.github.blazer030.sudoku;

import android.content.pm.ActivityInfo;

/** Phones stay in portrait; tablets, unfolded foldables and other large screens turn freely. */
final class OrientationPolicy {

    /**
     * Android's line between a phone and a large screen, by the display's smallest width. The display,
     * not the app's window: a letterboxed portrait window is narrow, and would keep itself locked.
     */
    static final int LARGE_SCREEN_SMALLEST_WIDTH_DP = 600;

    private OrientationPolicy() {}

    static int smallestWidthDp(int widthPixels, int heightPixels, float density) {
        return Math.round(Math.min(widthPixels, heightPixels) / density);
    }

    static int requestedOrientation(int displaySmallestWidthDp) {
        return displaySmallestWidthDp < LARGE_SCREEN_SMALLEST_WIDTH_DP
            ? ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
            : ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED;
    }
}
