package io.github.blazer030.sudoku;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class AppearanceStoreTest {

    private static final int WASHI = 0xFFF2ECDF;

    @Test
    public void restoresLightBarsSavedWhileTheAppWasNight() {
        // A light-only style paints light bars with dark icons even when the app is in night mode
        AppearanceStore.SystemBarColors lightBarsAtNight = new AppearanceStore.SystemBarColors(WASHI, true, true);

        assertTrue(AppearanceStore.restoresOnStart(lightBarsAtNight, true));
    }

    @Test
    public void skipsBarsSavedBeforeTheSystemThemeChanged() {
        AppearanceStore.SystemBarColors savedByDay = new AppearanceStore.SystemBarColors(WASHI, true, false);

        assertFalse(AppearanceStore.restoresOnStart(savedByDay, true));
    }
}
