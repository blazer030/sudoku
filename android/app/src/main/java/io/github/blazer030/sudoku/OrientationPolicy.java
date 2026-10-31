package io.github.blazer030.sudoku;

import android.content.pm.ActivityInfo;

/** Phones stay in portrait; tablets, unfolded foldables and other large screens turn freely. */
final class OrientationPolicy {

    /** Android's line between a phone and a large screen, by the window's smallest width. */
    static final int LARGE_SCREEN_SMALLEST_WIDTH_DP = 600;

    private OrientationPolicy() {}

    static int requestedOrientation(int smallestScreenWidthDp) {
        return smallestScreenWidthDp < LARGE_SCREEN_SMALLEST_WIDTH_DP
            ? ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
            : ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED;
    }
}
