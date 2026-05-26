import { createApp } from "vue";
import { createPinia } from "pinia";
import { Capacitor } from "@capacitor/core";
import "@/style/index.css";
import App from "@/presentation/App.vue";
import { router } from "@/router";

import { useSettingsStore } from "@/stores/settingsStore";
import { useGameStore } from "@/stores/gameStore";
import { useDonateStore } from "@/stores/donateStore";
import { useStatisticsStore } from "@/stores/statisticsStore";
import { ANALYTICS_KEY, type AnalyticsService } from "@/application/analytics/AnalyticsService";
import { FirebaseAnalyticsAdapter } from "@/infrastructure/analytics/FirebaseAnalyticsAdapter";
import { NoopAnalyticsAdapter } from "@/infrastructure/analytics/NoopAnalyticsAdapter";
import { BILLING_KEY, type BillingService } from "@/application/billing/BillingService";
import { NoopBillingAdapter } from "@/infrastructure/billing/NoopBillingAdapter";
import { PlayBillingAdapter } from "@/infrastructure/billing/PlayBillingAdapter";
import { ICON_KEY, type IconService } from "@/application/icon/IconService";
import { DynamicIconAdapter } from "@/infrastructure/icon/DynamicIconAdapter";
import { NoopIconAdapter } from "@/infrastructure/icon/NoopIconAdapter";
import { STATISTICS_REPOSITORY_KEY, type StatisticsRepository } from "@/application/statistics/StatisticsRepository";
import { LocalStorageStatisticsRepository } from "@/infrastructure/statistics/LocalStorageStatisticsRepository";

if (Capacitor.isNativePlatform() && "serviceWorker" in navigator) {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
            void registration.unregister();
        });
    });
}

const analytics: AnalyticsService = Capacitor.isNativePlatform()
    ? new FirebaseAnalyticsAdapter()
    : new NoopAnalyticsAdapter();

const billing: BillingService = Capacitor.isNativePlatform()
    ? new PlayBillingAdapter()
    : new NoopBillingAdapter();

const icon: IconService = Capacitor.isNativePlatform()
    ? new DynamicIconAdapter()
    : new NoopIconAdapter();

const statisticsRepository: StatisticsRepository = new LocalStorageStatisticsRepository();

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.provide(ANALYTICS_KEY, analytics);
app.provide(BILLING_KEY, billing);
app.provide(ICON_KEY, icon);
app.provide(STATISTICS_REPOSITORY_KEY, statisticsRepository);

useSettingsStore().setIconService(icon);
useGameStore().setAnalytics(analytics);
useDonateStore().setBilling(billing);
const statisticsStore = useStatisticsStore();
statisticsStore.setRepository(statisticsRepository);
await statisticsStore.loadFromRepository();

app.mount("#root");
