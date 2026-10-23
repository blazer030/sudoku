import { readWebFirebaseConfig } from "@/infrastructure/analytics/webFirebaseConfig";

const keyToOption = {
    VITE_FIREBASE_API_KEY: "apiKey",
    VITE_FIREBASE_AUTH_DOMAIN: "authDomain",
    VITE_FIREBASE_PROJECT_ID: "projectId",
    VITE_FIREBASE_STORAGE_BUCKET: "storageBucket",
    VITE_FIREBASE_MESSAGING_SENDER_ID: "messagingSenderId",
    VITE_FIREBASE_APP_ID: "appId",
    VITE_FIREBASE_MEASUREMENT_ID: "measurementId",
} as const;

const completeEnv = (): Record<string, unknown> => ({
    VITE_APP_ENV: "production",
    ...Object.fromEntries(Object.keys(keyToOption).map((key) => [key, `value-of-${key}`])),
});

describe("readWebFirebaseConfig", () => {
    it("maps every key in the production build", () => {
        expect(readWebFirebaseConfig(completeEnv())).toEqual(
            Object.fromEntries(
                Object.entries(keyToOption).map(([key, option]) => [option, `value-of-${key}`]),
            ),
        );
    });

    it("returns null outside the production build", () => {
        expect(readWebFirebaseConfig({ ...completeEnv(), VITE_APP_ENV: "develop" })).toBeNull();
    });

    it.each(Object.keys(keyToOption))("returns null when %s is missing", (key) => {
        const { [key]: _omitted, ...env } = completeEnv();
        expect(readWebFirebaseConfig(env)).toBeNull();
    });

    it.each(Object.keys(keyToOption))("returns null when %s is empty", (key) => {
        expect(readWebFirebaseConfig({ ...completeEnv(), [key]: "" })).toBeNull();
    });
});
