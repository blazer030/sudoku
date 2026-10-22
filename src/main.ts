import { createApp } from "vue";
import { createPinia } from "pinia";
import { Capacitor } from "@capacitor/core";
import "@/style/index.css";
import App from "@/presentation/App.vue";
import { router } from "@/router";

import { useSettingsStore } from "@/stores/settingsStore";
import { storeToRefs } from "pinia";
import { i18n } from "@/presentation/i18n";
import { startLocaleSync } from "@/presentation/i18n/localeSync";
import { startAppearanceSync } from "@/presentation/theme/appearanceSync";
import { startLauncherIconSync } from "@/presentation/theme/launcherIconSync";
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
import type { SystemBarService } from "@/application/systemBar/SystemBarService";
import { CapacitorSystemBarAdapter } from "@/infrastructure/systemBar/CapacitorSystemBarAdapter";
import { NoopSystemBarAdapter } from "@/infrastructure/systemBar/NoopSystemBarAdapter";
import type { AppearanceBridgeService } from "@/application/appearanceBridge/AppearanceBridgeService";
import { CapacitorAppearanceBridgeAdapter } from "@/infrastructure/appearanceBridge/CapacitorAppearanceBridgeAdapter";
import { NoopAppearanceBridgeAdapter } from "@/infrastructure/appearanceBridge/NoopAppearanceBridgeAdapter";
import { STATISTICS_REPOSITORY_KEY, type StatisticsRepository } from "@/application/statistics/StatisticsRepository";
import { IndexedDBStatisticsRepository } from "@/infrastructure/statistics/IndexedDBStatisticsRepository";
import { GAME_REPOSITORY_KEY, type GameRepository } from "@/application/game/GameRepository";
import { IndexedDBGameRepository } from "@/infrastructure/game/IndexedDBGameRepository";
import type { BackButtonService } from "@/application/backButton/BackButtonService";
import { CapacitorBackButtonAdapter } from "@/infrastructure/backButton/CapacitorBackButtonAdapter";
import { NoopBackButtonAdapter } from "@/infrastructure/backButton/NoopBackButtonAdapter";
import { handleBackButton } from "@/presentation/composables/backDismissal";

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

const systemBar: SystemBarService = Capacitor.isNativePlatform()
    ? new CapacitorSystemBarAdapter()
    : new NoopSystemBarAdapter();

const appearanceBridge: AppearanceBridgeService = Capacitor.isNativePlatform()
    ? new CapacitorAppearanceBridgeAdapter()
    : new NoopAppearanceBridgeAdapter();

const backButton: BackButtonService = Capacitor.isNativePlatform()
    ? new CapacitorBackButtonAdapter()
    : new NoopBackButtonAdapter();

const statisticsRepository: StatisticsRepository = new IndexedDBStatisticsRepository();
const gameRepository: GameRepository = new IndexedDBGameRepository();

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(i18n);
app.provide(ANALYTICS_KEY, analytics);
app.provide(BILLING_KEY, billing);
app.provide(ICON_KEY, icon);
app.provide(STATISTICS_REPOSITORY_KEY, statisticsRepository);
app.provide(GAME_REPOSITORY_KEY, gameRepository);

startAppearanceSync(storeToRefs(useSettingsStore()), systemBar, appearanceBridge);
startLauncherIconSync(storeToRefs(useSettingsStore()), icon);
backButton.listen(handleBackButton);
useDonateStore().setBilling(billing);
const gameStore = useGameStore();
gameStore.setAnalytics(analytics);
gameStore.setGameRepository(gameRepository);
const statisticsStore = useStatisticsStore();
statisticsStore.setRepository(statisticsRepository);
await Promise.all([
    statisticsStore.loadFromRepository(),
    gameStore.loadFromRepository(),
]);
startLocaleSync(storeToRefs(useSettingsStore()).language);

app.mount("#root");
