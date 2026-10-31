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
}
