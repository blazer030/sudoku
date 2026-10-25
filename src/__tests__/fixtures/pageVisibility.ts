// The page's visibility as a browser or the Android WebView reports it when the app goes to the background
export const setPageVisibility = (state: DocumentVisibilityState) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
    document.dispatchEvent(new Event("visibilitychange"));
};
