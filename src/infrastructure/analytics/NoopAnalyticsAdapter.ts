import type {
    AnalyticsEvent,
    AnalyticsService,
    ScreenName,
    UserPropertyName,
} from "@/application/analytics/AnalyticsService";

// Used when nothing reports: web outside production, or without config.
export class NoopAnalyticsAdapter implements AnalyticsService {
    async logEvent(_event: AnalyticsEvent): Promise<void> {
        // No-op.
    }

    async setScreen(_screen: ScreenName): Promise<void> {
        // No-op.
    }

    async setUserProperty(_name: UserPropertyName, _value: string): Promise<void> {
        // No-op.
    }
}
