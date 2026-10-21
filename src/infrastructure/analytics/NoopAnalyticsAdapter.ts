import type { AnalyticsEvent, AnalyticsService } from "@/application/analytics/AnalyticsService";

export class NoopAnalyticsAdapter implements AnalyticsService {
    async logEvent(_event: AnalyticsEvent): Promise<void> {
        // No-op; web has no analytics.
    }
}
