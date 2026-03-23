/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
    readonly VITE_BASE_URL: string;
    readonly VITE_APP_ENV: string;
}

declare module "*.vue" {
    import type { DefineComponent } from "vue";
    const component: DefineComponent<object, object, unknown>;
    export default component;
}
