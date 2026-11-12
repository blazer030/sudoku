import type { AnalyticsService } from "@/application/analytics/AnalyticsService";

export const createAnalyticsSpy = () => ({
    logEvent: vi.fn().mockResolvedValue(undefined),
    setScreen: vi.fn().mockResolvedValue(undefined),
    setUserProperty: vi.fn().mockResolvedValue(undefined),
}) satisfies AnalyticsService;
