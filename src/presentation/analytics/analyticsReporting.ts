import type { Router } from "vue-router";
import type { AnalyticsService } from "@/application/analytics/AnalyticsService";
import { startScreenTracking } from "@/presentation/analytics/screenTracking";
import { startUserPropertySync, type UserPropertySources } from "@/presentation/analytics/userPropertySync";

export interface AnalyticsReportingOptions {
    router: Router;
    analytics: AnalyticsService;
    userProperties: UserPropertySources;
    reportsIconSetting: boolean;
}

/**
 * Starts both kinds of reporting in the one order that works: GA attaches the user properties set so
 * far to each event, so the player's setup goes out before the first screen view can.
 */
export const startAnalyticsReporting = ({ router, analytics, userProperties, reportsIconSetting }: AnalyticsReportingOptions): (() => void) => {
    const stopUserProperties = startUserPropertySync(userProperties, analytics, { reportsIconSetting });
    const stopScreens = startScreenTracking(router, analytics);
    return () => {
        stopScreens();
        stopUserProperties();
    };
};
