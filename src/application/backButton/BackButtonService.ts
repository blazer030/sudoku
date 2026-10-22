/** Android's system Back key, which the app handles itself so Back can close a dialog first. */
export interface BackButtonService {
    /** Calls the handler on each press, with whether the web view has a page to go back to. */
    listen(handler: (canGoBack: boolean) => void): void;
}
