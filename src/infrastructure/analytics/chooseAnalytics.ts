import type { FirebaseOptions } from "firebase/app";
import type { AnalyticsService } from "@/application/analytics/AnalyticsService";
import { FirebaseAnalyticsAdapter } from "@/infrastructure/analytics/FirebaseAnalyticsAdapter";
import { NoopAnalyticsAdapter } from "@/infrastructure/analytics/NoopAnalyticsAdapter";

interface ChooseAnalyticsOptions {
    isNative: boolean;
    webConfig: FirebaseOptions | null;
    initializeWebFirebase: (config: FirebaseOptions) => Promise<void>;
}

// Analytics is optional: a web SDK that cannot load must not stop the app from starting.
export const chooseAnalytics = async ({
    isNative,
    webConfig,
    initializeWebFirebase,
}: ChooseAnalyticsOptions): Promise<AnalyticsService> => {
    if (isNative) {
        return new FirebaseAnalyticsAdapter();
    }
    if (webConfig === null) {
        return new NoopAnalyticsAdapter();
    }
    try {
        await initializeWebFirebase(webConfig);
        return new FirebaseAnalyticsAdapter();
    } catch {
        return new NoopAnalyticsAdapter();
    }
};
