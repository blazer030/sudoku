import type { Router } from "vue-router";

/**
 * Goes back a page. A page opened directly (a typed URL, a new tab) has nothing before it, where
 * going back would do nothing or leave the app, so it goes to `parent`, in place of its own entry.
 */
export const goBackOr = (router: Router, parent: string): void => {
    if (router.options.history.state.back === null) {
        void router.replace(parent);
        return;
    }
    router.back();
};
