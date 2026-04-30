import { createApp } from "vue";
import { createPinia } from "pinia";
import { Capacitor } from "@capacitor/core";
import "@/style/index.css";
import App from "@/presentation/App.vue";
import { router } from "@/router";

import { useSettingsStore } from "@/stores/settingsStore";
import { useGameStore } from "@/stores/gameStore";
import { useDonateStore } from "@/stores/donateStore";
import { ANALYTICS_KEY, type AnalyticsService } from "@/application/analytics/AnalyticsService";
import { FirebaseAnalyticsAdapter } from "@/infrastructure/analytics/FirebaseAnalyticsAdapter";
import { NoopAnalyticsAdapter } from "@/infrastructure/analytics/NoopAnalyticsAdapter";
import { BILLING_KEY, type BillingService } from "@/application/billing/BillingService";
import { NoopBillingAdapter } from "@/infrastructure/billing/NoopBillingAdapter";

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

const billing: BillingService = new NoopBillingAdapter();

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.provide(ANALYTICS_KEY, analytics);
app.provide(BILLING_KEY, billing);

useSettingsStore();
useGameStore().setAnalytics(analytics);
useDonateStore().setBilling(billing);

app.mount("#root");
