package io.github.blazer030.sudoku;

import static org.junit.Assert.assertEquals;

import android.content.pm.ActivityInfo;
import org.junit.Test;

public class OrientationPolicyTest {

    @Test
    public void phoneStaysInPortrait() {
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, OrientationPolicy.requestedOrientation(411));
    }

    @Test
    public void justUnderTabletWidthStaysInPortrait() {
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, OrientationPolicy.requestedOrientation(599));
    }

    @Test
    public void largeScreenTurnsFreely() {
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED, OrientationPolicy.requestedOrientation(600));
    }

    // A letterboxed app's own window shrinks below the line, so the decision reads the display instead

    @Test
    public void unfoldedFoldableTurnsFreelyWhateverItsWindow() {
        // Pixel Fold's inner display, 2208 × 1840 px at density 2.625
        int smallestWidthDp = OrientationPolicy.smallestWidthDp(2208, 1840, 2.625f);
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED, OrientationPolicy.requestedOrientation(smallestWidthDp));
    }

    @Test
    public void foldableOuterScreenStaysInPortrait() {
        // Pixel Fold's outer display, 1080 × 2092 px at density 2.625
        int smallestWidthDp = OrientationPolicy.smallestWidthDp(1080, 2092, 2.625f);
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, OrientationPolicy.requestedOrientation(smallestWidthDp));
    }

    @Test
    public void tabletInAStackedSplitTurnsFreely() {
        // The split's window is about 800 × 442 dp, but the tablet's display is 1600 × 2560 px at density 2
        int smallestWidthDp = OrientationPolicy.smallestWidthDp(1600, 2560, 2f);
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED, OrientationPolicy.requestedOrientation(smallestWidthDp));
    }

    @Test
    public void smallestWidthTakesTheShorterSideInDp() {
        assertEquals(800, OrientationPolicy.smallestWidthDp(2560, 1600, 2f));
    }
}
