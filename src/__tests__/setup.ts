import { config, enableAutoUnmount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { i18n } from "@/presentation/i18n";
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;

config.global.plugins.push(i18n);
// A mounted page left alive keeps re-rendering on every later locale switch and keeps its listeners
enableAutoUnmount(afterEach);

// Motion checks read the settings store, so every test starts with a store to read
beforeEach(() => {
    setActivePinia(createPinia());
});

afterEach(() => {
    i18n.global.locale.value = "en";
    document.documentElement.lang = "";
});
