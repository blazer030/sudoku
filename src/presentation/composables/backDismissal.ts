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

/** Handles one press of the system Back key: closes the topmost open dialog. */
export const handleBackButton = (_canGoBack: boolean): void => {
    dismissals[dismissals.length - 1]?.();
};
