import { FirebaseAnalytics } from "@capacitor-firebase/analytics";
import type { AnalyticsEvent, AnalyticsService } from "@/application/analytics/AnalyticsService";

export class FirebaseAnalyticsAdapter implements AnalyticsService {
    async logEvent(event: AnalyticsEvent): Promise<void> {
        const { name, ...params } = event;
        await FirebaseAnalytics.logEvent({ name, params });
    }
}
