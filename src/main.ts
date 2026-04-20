import { createApp } from "vue";
import { createPinia } from "pinia";
import { Capacitor } from "@capacitor/core";
import "@/style/index.css";
import App from "@/presentation/App.vue";
import { router } from "@/router";

import { useSettingsStore } from "@/stores/settingsStore";

if (Capacitor.isNativePlatform() && "serviceWorker" in navigator) {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
            void registration.unregister();
        });
    });
}

const app = createApp(App);
app.use(createPinia());
app.use(router);

useSettingsStore();

app.mount("#root");
