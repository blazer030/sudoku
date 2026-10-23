/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
    readonly VITE_BASE_URL: string;
    readonly VITE_APP_ENV: string;
    readonly VITE_FIREBASE_API_KEY: string | undefined;
    readonly VITE_FIREBASE_AUTH_DOMAIN: string | undefined;
    readonly VITE_FIREBASE_PROJECT_ID: string | undefined;
    readonly VITE_FIREBASE_STORAGE_BUCKET: string | undefined;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string | undefined;
    readonly VITE_FIREBASE_APP_ID: string | undefined;
    readonly VITE_FIREBASE_MEASUREMENT_ID: string | undefined;
}

declare module "*.vue" {
    import type { DefineComponent } from "vue";
    const component: DefineComponent<object, object, unknown>;
    export default component;
}
