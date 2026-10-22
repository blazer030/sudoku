// What the system Back key closes before it goes back a page, most recently opened last
const dismissals: (() => void)[] = [];

/** Lets Back close something while it is open; returns the function that withdraws it. */
export const registerBackDismissal = (dismiss: () => void): () => void => {
    dismissals.push(dismiss);
    return () => {
        const index = dismissals.lastIndexOf(dismiss);
        if (index !== -1) dismissals.splice(index, 1);
    };
};

/**
 * Handles one press of the system Back key: closes the topmost open dialog, or else goes back a
 * page through the router's history, so pages' leave guards still run. On the first page it does
 * nothing, as the web view did before the app listened for Back.
 */
export const handleBackButton = (canGoBack: boolean): void => {
    const dismiss = dismissals[dismissals.length - 1] as (() => void) | undefined;
    if (dismiss !== undefined) {
        dismiss();
        return;
    }
    if (canGoBack) window.history.back();
};
