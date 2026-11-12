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
import { selectIconStyle } from "@/presentation/components/icon/activeIconSet";
import { startLauncherIconSync } from "@/presentation/theme/launcherIconSync";
import { useGameStore } from "@/stores/gameStore";
import { useDonateStore } from "@/stores/donateStore";
import { useStatisticsStore } from "@/stores/statisticsStore";
import { ANALYTICS_KEY } from "@/application/analytics/AnalyticsService";
import { chooseAnalytics } from "@/infrastructure/analytics/chooseAnalytics";
import { readWebFirebaseConfig } from "@/infrastructure/analytics/webFirebaseConfig";
import type { BillingService } from "@/application/billing/BillingService";
import { NoopBillingAdapter } from "@/infrastructure/billing/NoopBillingAdapter";
import { PlayBillingAdapter } from "@/infrastructure/billing/PlayBillingAdapter";
import type { IconService } from "@/application/icon/IconService";
import { DynamicIconAdapter } from "@/infrastructure/icon/DynamicIconAdapter";
import { NoopIconAdapter } from "@/infrastructure/icon/NoopIconAdapter";
import type { SystemBarService } from "@/application/systemBar/SystemBarService";
import { CapacitorSystemBarAdapter } from "@/infrastructure/systemBar/CapacitorSystemBarAdapter";
import { NoopSystemBarAdapter } from "@/infrastructure/systemBar/NoopSystemBarAdapter";
import type { AppearanceBridgeService } from "@/application/appearanceBridge/AppearanceBridgeService";
import { CapacitorAppearanceBridgeAdapter } from "@/infrastructure/appearanceBridge/CapacitorAppearanceBridgeAdapter";
import { NoopAppearanceBridgeAdapter } from "@/infrastructure/appearanceBridge/NoopAppearanceBridgeAdapter";
import type { StatisticsRepository } from "@/application/statistics/StatisticsRepository";
import { IndexedDBStatisticsRepository } from "@/infrastructure/statistics/IndexedDBStatisticsRepository";
import type { GameRepository } from "@/application/game/GameRepository";
import { IndexedDBGameRepository } from "@/infrastructure/game/IndexedDBGameRepository";
import { LocalStorageLessonProgressRepository } from "@/infrastructure/lessons/LocalStorageLessonProgressRepository";
import { useLessonStore } from "@/stores/lessonStore";
import type { BackButtonService } from "@/application/backButton/BackButtonService";
import { CapacitorBackButtonAdapter } from "@/infrastructure/backButton/CapacitorBackButtonAdapter";
import { NoopBackButtonAdapter } from "@/infrastructure/backButton/NoopBackButtonAdapter";
import { startAnalyticsReporting } from "@/presentation/analytics/analyticsReporting";
import { handleBackButton } from "@/presentation/composables/backDismissal";

// The Android app, as against the web build: it picks every native adapter below
const isNative = Capacitor.isNativePlatform();

if (isNative && "serviceWorker" in navigator) {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
            void registration.unregister();
        });
    });
}

const analytics = await chooseAnalytics({
    isNative,
    webConfig: readWebFirebaseConfig(import.meta.env),
    initializeWebFirebase: async (config) => {
        const [{ initializeApp }, { initializeAnalytics }] = await Promise.all([
            import("firebase/app"),
            import("firebase/analytics"),
        ]);
        const app = initializeApp(config);
        // Screen tracking sends every page_view itself; this stops gtag adding one on load.
        // The plugin's later getAnalytics() returns this same instance.
        initializeAnalytics(app, { config: { send_page_view: false } });
    },
});

const billing: BillingService = isNative
    ? new PlayBillingAdapter()
    : new NoopBillingAdapter();

const icon: IconService = isNative
    ? new DynamicIconAdapter()
    : new NoopIconAdapter();

const systemBar: SystemBarService = isNative
    ? new CapacitorSystemBarAdapter()
    : new NoopSystemBarAdapter();

const appearanceBridge: AppearanceBridgeService = isNative
    ? new CapacitorAppearanceBridgeAdapter()
    : new NoopAppearanceBridgeAdapter();

const backButton: BackButtonService = isNative
    ? new CapacitorBackButtonAdapter()
    : new NoopBackButtonAdapter();

const statisticsRepository: StatisticsRepository = new IndexedDBStatisticsRepository();
const gameRepository: GameRepository = new IndexedDBGameRepository();

const app = createApp(App);
app.use(createPinia());
// Before the router is installed: that starts the first navigation, whose screen view must already
// carry the resolved language and the rest of the player's setup
const settings = storeToRefs(useSettingsStore());
startLocaleSync(settings.language);
startAnalyticsReporting({
    router,
    analytics,
    userProperties: { ...settings, locale: i18n.global.locale },
    reportsIconSetting: isNative,
});
app.use(router);
app.use(i18n);
app.provide(ANALYTICS_KEY, analytics);

startAppearanceSync(settings, systemBar, appearanceBridge);
startLauncherIconSync(settings, icon);
backButton.listen(handleBackButton);
useDonateStore().setBilling(billing);
const gameStore = useGameStore();
gameStore.setAnalytics(analytics);
gameStore.setGameRepository(gameRepository);
const statisticsStore = useStatisticsStore();
statisticsStore.setRepository(statisticsRepository);
useLessonStore().setRepository(new LocalStorageLessonProgressRepository());
await Promise.all([
    statisticsStore.loadFromRepository(),
    gameStore.loadFromRepository(),
    // So the first screen doesn't flash lucide's icons before the style's own
    selectIconStyle(useSettingsStore().style),
]);
app.mount("#root");
