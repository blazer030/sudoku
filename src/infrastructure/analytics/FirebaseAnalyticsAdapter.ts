import { FirebaseAnalytics } from "@capacitor-firebase/analytics";
import type {
    AnalyticsEvent,
    AnalyticsService,
    ScreenName,
    UserPropertyName,
} from "@/application/analytics/AnalyticsService";

// Analytics must never break the app, so a failing plugin call is swallowed.
const swallowFailure = async (call: () => Promise<void>): Promise<void> => {
    try {
        await call();
    } catch {
        // Reporting is best-effort.
    }
};

export class FirebaseAnalyticsAdapter implements AnalyticsService {
    async logEvent(event: AnalyticsEvent): Promise<void> {
        const { name, ...params } = event;
        await swallowFailure(() => FirebaseAnalytics.logEvent({ name, params }));
    }

    async setScreen(screen: ScreenName): Promise<void> {
        await swallowFailure(() => FirebaseAnalytics.setCurrentScreen({ screenName: screen }));
    }

    async setUserProperty(name: UserPropertyName, value: string): Promise<void> {
        await swallowFailure(() => FirebaseAnalytics.setUserProperty({ key: name, value }));
    }
}
