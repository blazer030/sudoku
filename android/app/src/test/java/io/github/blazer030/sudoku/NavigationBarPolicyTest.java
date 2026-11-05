package io.github.blazer030.sudoku;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class NavigationBarPolicyTest {

    private static final NavigationBarPolicy.Edges NONE = new NavigationBarPolicy.Edges(0, 0, 0);

    @Test
    public void threeButtonBarAtTheBottomIsReserved() {
        NavigationBarPolicy.Edges buttonBar = new NavigationBarPolicy.Edges(0, 0, 126);

        assertEquals(buttonBar, NavigationBarPolicy.reservedEdges(buttonBar, buttonBar));
    }

    @Test
    public void gestureHandleIsNotReserved() {
        // Gesture navigation's handle is not tappable, so the page runs under it
        NavigationBarPolicy.Edges gestureHandle = new NavigationBarPolicy.Edges(0, 0, 63);

        assertEquals(NONE, NavigationBarPolicy.reservedEdges(NONE, gestureHandle));
    }

    @Test
    public void noNavigationBarReservesNothing() {
        assertEquals(NONE, NavigationBarPolicy.reservedEdges(NONE, NONE));
    }

    @Test
    public void threeButtonBarOnTheRightInLandscapeIsReserved() {
        NavigationBarPolicy.Edges buttonBar = new NavigationBarPolicy.Edges(0, 126, 0);

        assertEquals(buttonBar, NavigationBarPolicy.reservedEdges(buttonBar, buttonBar));
    }

    @Test
    public void threeButtonBarOnTheLeftInSeascapeIsReserved() {
        NavigationBarPolicy.Edges buttonBar = new NavigationBarPolicy.Edges(126, 0, 0);

        assertEquals(buttonBar, NavigationBarPolicy.reservedEdges(buttonBar, buttonBar));
    }

    @Test
    public void reservesTheNavigationBarsSizeOnATappableSide() {
        // A tappable side keeps clear of the whole bar, however much of it the system counts as tappable
        NavigationBarPolicy.Edges tappable = new NavigationBarPolicy.Edges(0, 0, 100);
        NavigationBarPolicy.Edges navigationBars = new NavigationBarPolicy.Edges(0, 0, 126);

        assertEquals(navigationBars, NavigationBarPolicy.reservedEdges(tappable, navigationBars));
    }

    @Test
    public void tappableSideWithoutANavigationBarIsNotReserved() {
        // Something else tappable on that side, with no navigation bar there, leaves the page under it
        NavigationBarPolicy.Edges tappable = new NavigationBarPolicy.Edges(0, 0, 48);

        assertEquals(NONE, NavigationBarPolicy.reservedEdges(tappable, NONE));
    }
}
