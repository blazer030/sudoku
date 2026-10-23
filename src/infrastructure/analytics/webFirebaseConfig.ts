import type { FirebaseOptions } from "firebase/app";

const OPTION_BY_ENV_KEY: Record<string, keyof FirebaseOptions> = {
    VITE_FIREBASE_API_KEY: "apiKey",
    VITE_FIREBASE_AUTH_DOMAIN: "authDomain",
    VITE_FIREBASE_PROJECT_ID: "projectId",
    VITE_FIREBASE_STORAGE_BUCKET: "storageBucket",
    VITE_FIREBASE_MESSAGING_SENDER_ID: "messagingSenderId",
    VITE_FIREBASE_APP_ID: "appId",
    VITE_FIREBASE_MEASUREMENT_ID: "measurementId",
};

export const readWebFirebaseConfig = (env: Record<string, unknown>): FirebaseOptions | null => {
    if (env.VITE_APP_ENV !== "production") {
        return null;
    }
    const config: FirebaseOptions = {};
    for (const [envKey, option] of Object.entries(OPTION_BY_ENV_KEY)) {
        const value = env[envKey];
        if (typeof value !== "string" || value === "") {
            return null;
        }
        config[option] = value;
    }
    return config;
};
