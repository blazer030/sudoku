package io.github.blazer030.sudoku;

/**
 * Where the page keeps clear of the navigation bar. A button bar (three-button or two-button navigation,
 * or a tablet's taskbar) is tappable, and its keys would cover what a style draws at the page's edge, so
 * the page ends at it. Gesture navigation's handle is not tappable, and the page runs on under it.
 */
final class NavigationBarPolicy {

    /** Inset sizes in pixels on the sides a navigation bar can sit on. */
    record Edges(int left, int right, int bottom) {}

    private NavigationBarPolicy() {}

    /**
     * @param tappable the system's tappable-element insets
     * @param navigationBars the system's navigation-bar insets
     * @return the navigation bar's size on each side where it is tappable, else 0
     */
    static Edges reservedEdges(Edges tappable, Edges navigationBars) {
        return new Edges(
            reserved(tappable.left(), navigationBars.left()),
            reserved(tappable.right(), navigationBars.right()),
            reserved(tappable.bottom(), navigationBars.bottom())
        );
    }

    private static int reserved(int tappable, int navigationBar) {
        return tappable > 0 ? navigationBar : 0;
    }
}
